import * as mongoose from 'mongoose';
import { DiscountRuleSchema } from '../models/discountRule.model';

const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
mongoose.set('useFindAndModify', false);

class DiscountRulesRepo {
  async findByKey(key: string) {
    return await DiscountRule.find({ key })
      .findOne()
      .exec();
  }
}

export default new DiscountRulesRepo();
