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
}

export default new NotificationsRepo();
