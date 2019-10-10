import * as mongoose from 'mongoose';
import { PriceWeeklySchemaSchema } from '../models/priceWeeklySchema.model';
import { DiscountRuleSchema } from '../models/discountRule.model';

const PriceWeeklySchema = mongoose.model('PriceWeeklySchema', PriceWeeklySchemaSchema, 'priceWeeklySchema');
const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
mongoose.set('useFindAndModify', false);

class PricesRepo {
  async findByShopAndScript(shopId: string, scriptId: string) {
    return await PriceWeeklySchema.find({ shop: shopId, script: scriptId })
      .findOne()
      .exec();
  }

  async findDiscountRules() {
    return await DiscountRule.find().exec();
  }

  async saveOrUpdatePriceSchema(priceSchemaObj) {
    const { script, shop, priceSchema } = priceSchemaObj;
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await PriceWeeklySchema.findOneAndUpdate({ shop, script }, priceSchemaObj, options).exec();
  }

  async saveOrUpdateDiscountRule(discountRuleObj) {
    const { key } = discountRuleObj;
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await DiscountRule.findOneAndUpdate(discountRuleObj, discountRuleObj, options).exec();
  }
}

export default new PricesRepo();
