import { Request, Response, NextFunction } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class OrdersRoutes {
  ordersController: OrdersController = new OrdersController();

  routes(app): void {
    app.route('/orders/wechat/pay_callback').post(this.ordersController.confirmWechatPayment);
    app.route('/orders/wechat/refund_callback').post(this.ordersController.confirmWechatRefund);

    app.route('/orders').get(verifyToken, this.ordersController.getOrders);
    app.route('/orders/refund').post(verifyToken, this.ordersController.refundOrders);
    app.route('/orders/:orderId/pay').post(verifyToken, this.ordersController.payOrder);
    app.route('/orders/:orderId/pay-status').get(verifyToken, permit({ domain: 'order', operations: ['getOrderPaymentStatus'] }), this.ordersController.queryPaymentStatus);
    app.route('/orders/:orderId/refund').post(verifyToken, this.ordersController.refundOrder);
  }
}
