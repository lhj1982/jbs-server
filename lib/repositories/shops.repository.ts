import * as mongoose from 'mongoose';
import { ShopSchema } from '../models/shop.model';
const Shop = mongoose.model('Shop', ShopSchema);
mongoose.set('useFindAndModify', false);

class ShopsRepo {
  getAllCourses(options) {
    return Shop.findAll(options);
  }

  async find(params) {
    return await Shop.find(params).exec();
  }

  async saveOrUpdateShop(shop) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    };
    return await Shop.findOneAndUpdate({ _id: shop.id }, shop, options).exec();
  }
}
export default new ShopsRepo();
