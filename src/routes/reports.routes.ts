import { Request, Response, NextFunction } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class ReportsRoutes {
  reportsController: ReportsController = new ReportsController();

  routes(app): void {
    //
    app.route('/reports/events').get(verifyToken, permit({ domain: 'report', operations: ['getEventsReport'] }), this.reportsController.getEvents);

    app.route('/reports/orders').get(verifyToken, permit({ domain: 'report', operations: ['getOrdersReport'] }), this.reportsController.getOrders);
  }
}
