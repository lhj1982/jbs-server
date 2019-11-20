import * as mongoose from 'mongoose';
import { OrderSchema } from '../models/order.model';
const Order = mongoose.model('Order', OrderSchema);
mongoose.set('useFindAndModify', false);

class OrdersRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Order.findById(mongoose.Types.ObjectId(id))
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .exec();
  }

  async findUnique(createdBy: string, type: string, objectId: string) {
    return await Order.findOne({ createdBy, type, objectId }).exec();
  }

  async findByTradeNo(outTradeNo: string) {
    return await Order.findOne({ outTradeNo })
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .exec();
  }

  async createOrder(order, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { createdBy, type, objectId } = order;
    return await Order.findOneAndUpdate({ createdBy, type, objectId }, order, options).exec();
  }

  async updatePaymentByTradeNo(payment, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { outTradeNo } = payment;
    return await Order.findOneAndUpdate({ outTradeNo }, { $set: { payment } }, options).exec();
  }
}
export default new OrdersRepo();
