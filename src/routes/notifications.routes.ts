import { Request, Response, NextFunction } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class NotificationsRoutes {
  notificationsController: NotificationsController = new NotificationsController();

  routes(app): void {
    //
    app.route('/notifications/sms-send-callback').post(this.notificationsController.getSmsSendReports);
    app.route('/notifications/qrcode-upload-callback').post(this.notificationsController.getQrcodeUploadStatus);

    app.route('/notifications/:serialNumber').put(verifyToken, permit({ domain: 'notification', operations: ['update'] }), this.notificationsController.updateNotification);

    app.route('/notifications').get(verifyToken, permit({ domain: 'notifications', operations: ['read'] }), this.notificationsController.getNotifications);
  }
}
