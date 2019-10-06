import * as mongoose from 'mongoose';
import { EventUserSchema } from '../models/eventUser.model';
const EventUser = mongoose.model('EventUser', EventUserSchema, 'eventUsers');
mongoose.set('useFindAndModify', false);

class EventUsersRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await EventUser.where({ _id: id })
      .findOne()
      .exec();
  }

  async findByEvent(eventId: string, filter = { status: ['unpaid', 'paid'] }) {
    const { status } = filter;
    return await EventUser.find({
      event: eventId,
      status: { $in: status }
    })
      .populate('event', ['_id', 'name'])
      .populate('user', ['_id'])
      .exec();
  }

  async findEventUser(eventId: string, userId: string, userName?: string) {
    // console.log(eventId);
    // console.log(userName);
    return await EventUser.where({ event: eventId, user: userId })
      .findOne()
      .exec();
  }

  async findByUser(userId: string) {
    return await EventUser.find({
      user: userId,
      status: { $in: ['unpaid', 'paid'] }
    })
      .populate({
        path: 'event',
        populate: { path: 'script', select: 'key name' }
      })
      .populate({
        path: 'event',
        populate: { path: 'shop', select: 'key name' }
      })
      .populate('user', ['nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language'])
      .exec();
  }

  async saveOrUpdate(eventUser, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { event, user, userName, source, createdAt, status, mobile, wechatId } = eventUser;
    const e = await this.findEventUser(event, user, userName);
    // console.log(e);
    if (!e) {
      return await EventUser({
        event,
        user,
        userName,
        source,
        status,
        mobile,
        wechatId,
        createdAt
      }).save(options);
    } else {
      return await EventUser.findOneAndUpdate({ _id: e._id }, { event, user, userName, source, createdAt, status, mobile, wechatId }, options).exec();
    }
  }
}
export default new EventUsersRepo();
