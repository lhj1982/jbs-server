import * as mongoose from 'mongoose';
import { DiscountRuleSchema } from '../models/discountRule.model';
import { DiscountRuleMapSchema } from '../models/discountRuleMap.model';
import { getDay, getTime } from '../utils/dateUtil';

// const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
const DiscountRuleMap = mongoose.model('DiscountRuleMap', DiscountRuleMapSchema, 'discountRulesMap');
mongoose.set('useFindAndModify', false);

class DiscountRulesMapRepo {
  async findByShopAndScript(shopId: string, scriptId: string, startTime: string) {
    const condition = {};
    if (scriptId) {
      condition['script'] = scriptId;
    }
    if (shopId) {
      condition['shop'] = shopId;
    }
    const discountRuleCondition = {};
    if (startTime) {
      const weekDay = getDay(startTime);
      const time = getTime(startTime);
      console.log(startTime);
      console.log(weekDay);
      console.log(time);
      {
        days: {
          all: [weekDay];
        }
      }
      discountRuleCondition['days'] = { $all: [weekDay] };
      discountRuleCondition['timeSpan'] = {
        $elemMatch: { from: { $lte: time }, to: { $gte: time } }
      };
    }
    // console.log(discountRuleCondition);
    return await DiscountRuleMap.find(condition)
      .populate('script', ['_id', 'key', 'name'])
      .populate('shop', ['_id', 'key', 'name'])
      // .populate('discountRule', ['key', 'description', 'timeDescription', 'days', 'timeSpan', 'discount'])
      .populate({
        path: 'discountRule',
        match: discountRuleCondition
      })
      .exec();
  }

  async saveOrUpdate(discountRuleMapObj) {
    const { key } = discountRuleMapObj;
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await DiscountRuleMap.findOneAndUpdate({}, discountRuleMapObj, options).exec();
  }
}

export default new DiscountRulesMapRepo();
