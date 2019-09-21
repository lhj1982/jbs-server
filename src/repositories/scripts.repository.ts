import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
const Script = mongoose.model('Script', ScriptSchema);
mongoose.set('useFindAndModify', false);

class ScriptsRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Script.findById(mongoose.Types.ObjectId(id)).exec();
  }

  async find(params) {
    return await Script.find(params).exec();
  }

  async findOne(params) {
    return await Script.where(params)
      .findOne()
      .exec();
  }

  async saveOrUpdate(script) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await Script.findOneAndUpdate({ key: script.key }, script, options).exec();
  }
}
export default new ScriptsRepo();
