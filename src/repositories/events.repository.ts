import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
import { EventSchema } from '../models/event.model';
import { PriceWeeklySchemaSchema } from '../models/priceWeeklySchema.model';
import { DiscountRulesSchema } from '../models/discountRules.model';
const Event = mongoose.model('Event', EventSchema);
const PriceWeeklySchema = mongoose.model('PriceWeeklySchema', PriceWeeklySchemaSchema, 'priceWeeklySchema');
const DiscountRules = mongoose.model('DiscountRules', DiscountRulesSchema, 'discountRules');
mongoose.set('useFindAndModify', false);

class EventsRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Event.where({ _id: id })
      .findOne()
      .populate('script', ['_id', 'name', 'description', 'duration'])
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone'])
      .populate('hostUser', ['_id', 'nickName', 'mobile'])
      .populate('members', ['_id', 'user', 'source', 'paid', 'createdAt'])
      .exec();
  }

  async findPriceWeeklySchemaByEvent(scriptId: string, shopId: string) {
    return await PriceWeeklySchema.find(
      {
        script: scriptId,
        shop: shopId
      },
      { _id: 0, priceSchema: 1, createdAt: 1, updatedAt: 1 }
    )
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
      .sort({ startTime: 1 })
      .exec();
    return { pagination, data: pagedEvents };
  }

  async findByDate(fromDate, toDate) {
    return await Event.find({
      startTime: {
        $gte: fromDate,
        $lte: toDate
      }
    })
      .populate('script', ['_id', 'name', 'description', 'duration'])
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone'])
      .populate('hostUser', ['_id', 'nickName', 'mobile'])
      .sort({ startTime: 1 })
      .exec();
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
    const { shop, script, startTime, endTime, hostUser } = event;
    return await Event.findOneAndUpdate({ shop, script, startTime, endTime, hostUser }, event, options).exec();
  }

  async findDiscountRulesByShopAndScript(shopId: string, scriptId?: string) {
    const condition = { shop: shopId };
    if (scriptId) {
      condition['script'] = scriptId;
    }
    return await DiscountRules.find(condition, {
      _id: 0,
      rules: 1,
      createdAt: 1,
      updatedAt: 1
    }).exec();
  }
}
export default new EventsRepo();
