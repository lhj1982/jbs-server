import * as mongoose from 'mongoose';
import { ShopSchema } from '../models/shop.model';
import { escapeRegex } from '../utils/stringUtil';
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
    const { offset, limit, keyword } = params;
    const total = await Shop.countDocuments({}).exec();
    const pagination = { offset, limit, total };
    let condition = {};
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), 'gi');
      condition = { name: regex };
    }
    const pagedShops = await Shop.find(condition)
      .populate('scripts', ['_id', 'name', 'description', 'duration'])
      .skip(offset)
      .limit(limit)
      .exec();
    return { pagination, data: pagedShops };
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
