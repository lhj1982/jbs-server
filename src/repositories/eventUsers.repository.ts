import * as mongoose from 'mongoose';
import { EventUserSchema } from '../models/eventUser.model';
const EventUser = mongoose.model('EventUser', EventUserSchema);
mongoose.set('useFindAndModify', false);

class EventUsersRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await EventUser.where({ _id: id })
      .findOne()
      .exec();
  }

  async findEventUser(eventId: string, userId: string, userName?: string) {
    // console.log(eventId);
    // console.log(userName);
    return await EventUser.where({
      $or: [{ event: eventId, userName }, { event: eventId, user: userId }]
    })
      .findOne()
      .exec();
  }

  async findByUser(userId: string) {
    return await EventUser.find({ user: userId })
      .populate('event')
      .populate('user')
      .exec();
  }

  async saveOrUpdate(eventUser) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { eventId, userId, userName, source, createdAt, status } = eventUser;
    const e = await this.findEventUser(eventId, userId, userName);
    // console.log(e);
    if (!e) {
      return await EventUser.create({
        event: eventId,
        user: userId,
        userName,
        source,
        status,
        createdAt
      });
    } else {
      return e;
    }
  }
}
export default new EventUsersRepo();
