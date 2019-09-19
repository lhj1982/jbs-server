import * as mongoose from 'mongoose';
import { ShopSchema } from '../models/shop.model';
const Shop = mongoose.model('Shop', ShopSchema);
mongoose.set('useFindAndModify', false);

class ShopsRepo {
  getAllCourses(options) {
    return Shop.findAll(options);
  }

  async findById(id: string) {
    // console.log(mongoose.Types.ObjectId.isValid(id));
    return await Shop.findById(mongoose.Types.ObjectId(id)).exec();
  }

  async find(params) {
    return await Shop.find(params).exec();
  }

  async findOne(params) {
    return await Shop.where(params)
      .findOne()
      .exec();
  }

  async saveOrUpdate(shop) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await Shop.findOneAndUpdate({ key: shop.key }, shop, options).exec();
  }
}
export default new ShopsRepo();
