import * as mongoose from 'mongoose';
import { PriceWeeklySchemaSchema } from '../models/priceWeeklySchema.model';

const PriceWeeklySchema = mongoose.model('PriceWeeklySchema', PriceWeeklySchemaSchema, 'priceWeeklySchema');
mongoose.set('useFindAndModify', false);

class PricesRepo {
  async findByShopAndScript(shopId: string, scriptId: string) {
    return await PriceWeeklySchema.find({ shop: shopId, script: scriptId })
      .findOne()
      .exec();
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
}

export default new PricesRepo();
