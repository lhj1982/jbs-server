import { Request, Response, NextFunction } from 'express';
import { MessagesController } from '../controllers/messages.controller';

export class MessagesRoutes {
  messagesController: MessagesController = new MessagesController();

  routes(app): void {
    //
    app.route('/messages/sms-send-callback').post(this.messagesController.getSmsSendReports);
  }
}
