import { Request, Response, NextFunction } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';

export class NotificationsRoutes {
  notificationsController: NotificationsController = new NotificationsController();

  routes(app): void {
    //
    app.route('/notifications/sms-send-callback').post(this.notificationsController.getSmsSendReports);
  }
}
