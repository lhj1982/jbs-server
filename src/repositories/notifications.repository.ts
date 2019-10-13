import * as mongoose from 'mongoose';
import { NotificationSchema } from '../models/notification.model';

const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
mongoose.set('useFindAndModify', false);

class NotificationsRepo {
  async findByTaskId(taskId: string) {
    return await Notification.find({ taskId })
      .findOne()
      .exec();
  }

  async saveOrUpdate(notification) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { taskId } = notification;
    return await Notification.findOneAndUpdate({ taskId }, notification, options).exec();
  }

  async saveNotifications(notifications, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const response = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const { eventType, audience, objectId, recipients } = notification;
      const resp = await Notification.findOneAndUpdate({ eventType, audience, objectId, recipients }, { $set: notification }, options).exec();
      response.push(resp);
    }
    return response;
  }

  async updateNotificationStatus(notification, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };

    const { eventType, audience, objectId, recipients } = notification;
    console.log(`Update status ${JSON.stringify(notification)}`);
    const resp = await Notification.findOneAndUpdate({ eventType, audience, objectId, recipients }, notification, options).exec();

    return resp;
  }
}

export default new NotificationsRepo();
