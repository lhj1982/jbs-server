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

  async findByScript(scriptId: string, filter = { status: ['completed'] }) {
    const { status } = filter;
    const eventUsers = await EventUser.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventObj'
        }
      },
      {
        $unwind: { path: '$eventObj' }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userObj'
        }
      },
      {
        $unwind: { path: '$userObj' }
      },
      {
        $match: {
          'eventObj.status': { $in: ['completed'] },
          'eventObj.script': mongoose.Types.ObjectId(scriptId)
        }
      },
      {
        $group: {
          _id: '$userObj._id',
          user: { $addToSet: '$userObj' }
        }
      },
      {
        $unwind: {
          path: '$user'
        }
      },
      {
        $sort: { 'eventObj.startTime': -1 }
      },
      {
        $project: {
          _id: 0,
          user: 1
        }
      }
    ]).exec();

    return eventUsers;
  }

  async findEventUser(eventId: string, userId: string, userName?: string) {
    // console.log(eventId);
    // console.log(userName);
    return await EventUser.where({ event: eventId, user: userId })
      .populate('event', ['_id', 'name'])
      .populate('user', ['_id'])
      .findOne()
      .exec();
  }

  // async findByUser(userId: string) {
  //   return await EventUser.find({
  //     user: userId,
  //     status: { $in: ['unpaid', 'paid'] }
  //   })
  //     .populate({
  //       path: 'event',
  //       populate: { path: 'script', select: 'key name' }
  //     })
  //     .populate({
  //       path: 'event',
  //       populate: { path: 'shop', select: 'key name' }
  //     })
  //     .populate('user', ['nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language'])
  //     .exec();
  // }

  async saveOrUpdate(eventUser, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { event, user, userName, source, createdAt, status, mobile, wechatId, statusNote, endorsements, tags } = eventUser;
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
        createdAt,
        endorsements,
        tags
      }).save(options);
    } else {
      return await EventUser.findOneAndUpdate(
        { _id: e._id },
        {
          event,
          user,
          userName,
          source,
          createdAt,
          status,
          mobile,
          wechatId,
          statusNote,
          endorsements,
          tags
        },
        options
      ).exec();
    }
  }

  async update(eventUser, opt = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id } = eventUser;
    return await EventUser.findOneAndUpdate({ _id }, eventUser, options).exec();
  }
}
export default new EventUsersRepo();
