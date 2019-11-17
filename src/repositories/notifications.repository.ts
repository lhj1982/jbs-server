import * as mongoose from 'mongoose';
import { NotificationSchema } from '../models/notification.model';
import logger from '../utils/logger';
const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
mongoose.set('useFindAndModify', false);

class NotificationsRepo {
  async findByTaskId(taskId: string) {
    return await Notification.find({ taskid: taskId })
      .findOne()
      .exec();
  }

  async find(params) {
    const { offset, limit, audience } = params;
    const condition = { audience: audience };
    const notifications = await Notification.find(condition)
      .sort({ createdAt: -1 })
      .exec();

    const total = notifications.length;
    const pagination = { offset, limit, total };
    const pagedNotifications = notifications.slice(offset, offset + limit);
    return { pagination, data: pagedNotifications };
  }

  async findBySerialNumber(serialNumber: string) {
    const condition = { serialNumber: serialNumber };
    return await Notification.find(condition)
      .findOne()
      .exec();
  }

  async saveOrUpdate(notification, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id, serialNumber } = notification;
    if (_id) {
      return await Notification.findOneAndUpdate({ _id }, notification, options).exec();
    } else {
      return await Notification.findOneAndUpdate({ serialNumber }, notification, options).exec();
    }
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
      const { serialNumber } = notification;
      logger.info(`Saving notification to db... serialNumber: ${serialNumber}`);
      const resp = await Notification.findOneAndUpdate({ serialNumber }, { $set: notification }, options).exec();
      response.push(resp);
    }
    return response;
  }

  // async updateNotificationStatus(notification, opts = {}) {
  //   const options = {
  //     ...opts,
  //     new: true,
  //     upsert: true,
  //     setDefaultsOnInsert: true,
  //     returnNewDocument: true
  //   };

  //   const { serialNumber } = notification;
  //   console.log(`Update status ${JSON.stringify(notification)}`);
  //   const resp = await Notification.findOneAndUpdate({ serialNumber }, notification, options).exec();
  //   return resp;
  // }
}

export default new NotificationsRepo();
