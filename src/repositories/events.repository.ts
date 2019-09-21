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
    return await Event.find(params).exec();
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
