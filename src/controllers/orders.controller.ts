import { Request, Response, NextFunction } from 'express';
import RefundsRepo from '../repositories/refunds.repository';
import OrdersRepo from '../repositories/orders.repository';
import OrderService from '../services/order.service';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException, OrderCannotPayException, CannotRefundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import logger from '../utils/logger';

export class OrdersController extends BaseController {
  getOrders = async (req: Request, res: Response, next: NextFunction) => {};

  payOrder = async (req: Request, res: Response, next: NextFunction) => {
    const {
      loggedInUser: { id: loggedInUserId }
    } = res.locals;
    const { orderId } = req.params;
    const order = await OrdersRepo.findById(orderId);
    if (!order) {
      next(new ResourceNotFoundException('Order', orderId));
      return;
    }
    const {
      orderStatus,
      createdBy: { id: createdByUserId }
    } = order;
    if (orderStatus != 'created') {
      next(new OrderCannotPayException(orderId));
      return;
    }
    // console.log(loggedInUserId);
    // console.log(createdByUserId);
    if (loggedInUserId != createdByUserId) {
      next(new AccessDeinedException(loggedInUserId, `You can only pay your own order`));
      return;
    }

    const session = await OrdersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const payment = await OrderService.wechatPay(order);
      const orderToUpdate = Object.assign(order.toObject(), { payment });
      const newOrder = await OrdersRepo.updatePaymentByTradeNo(orderToUpdate, opts);
      // console.log('ssss' + response);
      await session.commitTransaction();
      await OrdersRepo.endSession();
      res.json({ code: 'SUCCESS', data: newOrder });
    } catch (err) {
      await session.abortTransaction();
      await OrdersRepo.endSession();
      console.log(err);
      next(err);
    }
  };

  confirmWechatPayment = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    logger.info(`wechat payment notify ${req}`);
    const session = await OrdersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const payment = await OrderService.confirmWechatPayment(body);
      const { outTradeNo } = payment;
      const order = await OrdersRepo.findByTradeNo(outTradeNo);
      if (!order) {
        next(new ResourceNotFoundException('Order', outTradeNo));
        await session.abortTransaction();
        await OrdersRepo.endSession();
        return;
      }
      const orderToUpdate = Object.assign(order.toObject(), {
        orderStatus: 'paid',
        payment
      });
      const newOrder = await OrderService.updatePaymentStatus(orderToUpdate, opts);
      await session.commitTransaction();
      await OrdersRepo.endSession();
      res.json({ code: 'SUCCESS', data: newOrder });
    } catch (err) {
      await session.abortTransaction();
      await OrdersRepo.endSession();
      logger.error(err);
      next(err);
    }
  };

  queryPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { orderId } = req.params;
    const order = await OrdersRepo.findById(orderId);
    if (!order) {
      next(new ResourceNotFoundException('Order', orderId));
      return;
    }

    try {
      const response = await OrderService.queryPaymentStatus(order);
      res.json({ code: 'SUCCESS', data: response });
    } catch (err) {
      console.log(err);
      next(err);
    }
  };

  /**
   * Go throw all orders which are marked as refund_requested, and call refund.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  refundOrders = async (req: Request, res: Response, next: NextFunction) => {
    const session = await OrdersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const refunds = await OrderService.refundOrders(opts);
      await session.commitTransaction();
      await OrdersRepo.endSession();
      res.json({ code: 'SUCCESS', data: refunds });
    } catch (err) {
      await session.abortTransaction();
      await OrdersRepo.endSession();
      next(err);
    }
  };

  refundOrder = async (req: Request, res: Response, next: NextFunction) => {
    const {
      loggedInUser: { id: loggedInUserId }
    } = res.locals;
    const { orderId } = req.params;
    const { amount } = req.body;
    const order = await OrdersRepo.findById(orderId);
    if (!order) {
      next(new ResourceNotFoundException('Order', orderId));
      return;
    }
    const { amount: orderAmount } = order;
    if (amount > orderAmount) {
      next(new CannotRefundException(orderId, `You cannot refund ${amount}`));
    }
    try {
      const refund = await OrderService.refund(order, amount);
    } catch (err) {
      next(err);
    }
  };

  confirmWechatRefund = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    logger.info(`wechat refund notify ${req}`);
    const session = await OrdersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const refundData = await OrderService.confirmWechatRefund(body);
      const { outRefundNo, refundStatus } = refundData;
      const refund = await RefundsRepo.findByRefundNo(outRefundNo);
      let refundToUpdate = {};
      if (refundStatus !== 'SUCCESS') {
        refundToUpdate = Object.assign(refund.toObject(), { status: 'failed' }, ...refundData);
      }
      const newRefund = await RefundsRepo.saveOrUpdate(refundToUpdate, opts);
      await session.commitTransaction();
      await OrdersRepo.endSession();
      res.json({ code: 'SUCCESS', data: newRefund });
    } catch (err) {
      await session.abortTransaction();
      await OrdersRepo.endSession();
      logger.error(err);
      next(err);
    }
  };
}
