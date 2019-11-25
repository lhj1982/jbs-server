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

  /**
   * payment notify status: {"return_code":["SUCCESS"],"appid":["wxf59749a45686779c"],"mch_id":["1560901281"],"nonce_str":["8010b252d85da496c326787c8aa9920c"],"req_info":["LR3HUI1qW+C5FaIAP/Q44K3R7aIhafRcLRcRfuxZZ9nkM+RKM6k0QeTaJgoH6yZghnQGsHDQUAY9h5GyhZ0/XbZKABO2VhbfI2gMsCuPBffo7NmlNTvcMpqTX1fkAncYVQjk9vlQXZtdA5CBXOtpcw2Em6X36Rp20I16YlbMmVWEzip/JLAYohZMVo0K4Jt6LMofFPfTMn7tdS/VzQ/ezT7YmVAMmm82p3HMTA81gN8tMIW7L/ZmHF67iN6viMTsF+le5V0WG9OVOpRYuj2iHvGy183JK4W8DPkcmVtwTu/j8h7zTWA8H76P1A7Hb/rd31auYE6LkNDz+TgWNAOgNMNsnXaz2YNfJOwag7WYN6pSCTDOA6hk+xnY4X19BcaELA7X3RXJLS4GQiLcVbXSylTMHzZnoHO1M9Sn0jOpQtpV3yjYms/vUXzDRsNafVnfItmaM05mg0FfoW1fGOmhfRL7RjFBIFyLeq8QwptFDAFTTQutwMFHGiXGeN5VJq01Rlfb9UbGpEobwOGALWVSBgN9SVYOpORUuznbscZPhSP5lRjnG64qhLsoapywCBDMAtbi/5V35iinjz5I/2uDpYIkhXoJzJnnrGtAxDVCOZcTjbRvWGFCt+459m4H0kiE1Da1quAlIsBp12WPQtZhAlAmo/FOd5kbKrodn0OWIPieQAlwZs7ZlZ1W0NXEaPedn4MoEoWwyzEmoI4Yu8gXXt9MocvoLSaGRQa9vsIpYKkjJWoR9wqcNLTmM+peNVgDD3aUTxOAxPixejcFuxSjWRZXDtxkHDvcYsJpAK471xYZsUSF2evPhb6Rgc5qn8BPnGIxZOoVotGmJQiFsNPFBRaS91OtaJLymmgOsp+9SBuaa/ChwvHLS1k5WatWsiffbk3IponOtbvgPu+cPLWA5MKiNWl7eMJfdF5CSXOfLVIjMW4ZExaLfEi1BOMqsjNUp1ad2M9XnGeULb+l9RNjErQw4zbVLh8HkeNCEWxzzCMAIgUdv89cxhtpgh9Jbu1mrUmB3S3wjJ8pKRBvwXW+6unEDSaEWRS7Z9DmEsJYhANeW79iPBzYqYgSsCMyogO6S/ISH5r8HvMrljK9n+Q3Qw=="]}

   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  confirmWechatRefund = async (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    logger.info(`wechat refund notify ${req}`);
    const session = await OrdersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const refundData = await OrderService.confirmWechatRefund(body);
      // console.log(refundData);
      const { outRefundNo, refundStatus } = refundData;
      const refund = await RefundsRepo.findByRefundNo(outRefundNo);
      let refundToUpdate = {};
      if (refundStatus !== 'SUCCESS') {
        refundToUpdate = Object.assign(refund.toObject(), { status: 'failed' }, refundData);
      } else {
      	refundToUpdate = Object.assign({}, refund.toObject(), refundData);
      }
      // console.log(refundToUpdate);
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
