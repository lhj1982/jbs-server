import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
import { EventSchema } from '../models/event.model';
const Event = mongoose.model('Event', EventSchema);
mongoose.set('useFindAndModify', false);

class EventsRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Event.where({ _id: id })
      .findOne()
      .exec();
  }

  async find(params) {
    const { offset, limit, keyword } = params;
    const total = await Event.countDocuments({}).exec();
    const pagination = { offset, limit, total };
    const pagedEvents = await Event.find({})
      .populate('script', ['_id', 'name', 'description', 'duration'])
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone'])
      .populate('hostUser', ['_id', 'nickName', 'mobile'])
      .skip(offset)
      .limit(limit)
      .exec();
    return { pagination, data: pagedEvents };
  }

  async findOne(params) {
    return await Event.where(params)
      .findOne()
      .exec();
  }

  async saveOrUpdate(event) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { shop, script, startTime, endTime } = event;
    return await Event.findOneAndUpdate({ shop, script, startTime, endTime }, event, options).exec();
  }
}
export default new EventsRepo();
