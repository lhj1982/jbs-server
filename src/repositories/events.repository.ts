import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
import { EventSchema } from '../models/event.model';
import { PriceWeeklySchemaSchema } from '../models/priceWeeklySchema.model';
import { DiscountRuleSchema } from '../models/discountRule.model';
import { CommonRepo } from './common.repository';
const Event = mongoose.model('Event', EventSchema, 'events');
const PriceWeeklySchema = mongoose.model('PriceWeeklySchema', PriceWeeklySchemaSchema, 'priceWeeklySchema');
const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
mongoose.set('useFindAndModify', false);

class EventsRepo extends CommonRepo {
  async getSession() {
    return super.getSession(Event);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Event.where({ _id: id })
      .findOne()
      .populate('script', ['_id', 'name', 'duration'])
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone'])
      .populate('hostUser', ['_id', 'nickName', 'mobile'])
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } },
        select: '_id user source status createdAt'
      })
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
    const { offset, limit, keyword, scriptId, shopId } = params;
    const condition = {};
    if (!scriptId) {
      condition['script'] = scriptId;
    }
    if (!shopId) {
      condition['shop'] = shopId;
    }
    const total = await Event.countDocuments(condition).exec();
    const pagination = { offset, limit, total };
    const pagedEvents = await Event.find(condition)
      .populate('script', ['_id', 'name', 'duration'])
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone'])
      .populate('hostUser', ['_id', 'nickName', 'mobile'])
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } },
        select: 'user source status'
      })
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

  async saveOrUpdate(event, opt: object = {}) {
    const options = {
      ...opt,
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
    return await DiscountRule.find(condition, {
      _id: 0,
      rules: 1,
      createdAt: 1,
      updatedAt: 1
    }).exec();
  }
}
export default new EventsRepo();
