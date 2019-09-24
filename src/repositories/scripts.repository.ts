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
    const { offset, limit, keyword } = params;
    const total = await Script.countDocuments({}).exec();
    const pagination = { offset, limit, total };
    const pagedScripts = await Script.find({})
      .populate('shops')
      .skip(offset)
      .limit(limit)
      .exec();
    return { pagination, data: pagedScripts };
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
