import * as mongoose from 'mongoose';
import { escapeRegex } from '../utils/stringUtil';
import { ScriptSchema } from '../models/script.model';
const Script = mongoose.model('Script', ScriptSchema);
mongoose.set('useFindAndModify', false);

class ScriptsRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Script.findById(mongoose.Types.ObjectId(id))
      .populate('shops')
      .populate({
        path: 'events',
        match: { status: { $in: ['ready'] } },
        populate: {
          path: 'hostUser',
          select: 'nickName avatarUrl gender country province city language mobile wechatId ageTag'
        },
        options: { sort: { startTime: -1 } }
      })
      .populate('discountRuleMap')
      .exec();
  }

  async find(params) {
    const { offset, limit, keyword } = params;
    let condition = {};
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), 'gi');
      condition = {
        $or: [{ name: regex }, { description: regex }, { tags: keyword }]
      };
    }
    // console.log(condition);
    const total = await Script.countDocuments(condition).exec();
    const pagination = { offset, limit, total };
    const pagedScripts = await Script.find(condition)
      .populate('shops')
      .populate('discountRuleMap')
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
