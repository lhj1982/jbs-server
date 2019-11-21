import * as mongoose from 'mongoose';
import { OrderSchema } from '../models/order.model';
import { CommonRepo } from './common.repository';
const Order = mongoose.model('Order', OrderSchema, 'orders');
mongoose.set('useFindAndModify', false);

class OrdersRepo extends CommonRepo {
  async getSession() {
    return super.getSession(Order);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Order.findById(mongoose.Types.ObjectId(id))
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .exec();
  }

  // async findUnique(params) {
  //   return await Order.findOne(params).exec();
  // }
  async findByParams(params) {
    return await Order.find(params).exec();
  }

  async findByTradeNo(outTradeNo: string) {
    return await Order.findOne({ outTradeNo })
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .exec();
  }

  async getCandidateRefundOrders(filter, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
  }

  async createOrder(order, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { outTradeNo } = order;
    return await Order.findOneAndUpdate({ outTradeNo }, order, options).exec();
  }

  async saveOrUpdate(order, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { outTradeNo } = order;
    return await Order.findOneAndUpdate({ outTradeNo }, order, options).exec();
  }

  async updateStatus(criteria, orderStatus, opts = {}) {
    const options = {
      ...opts,
      upsert: false,
      returnNewDocument: true,
      multi: true
    };
    return await Order.updateMany(criteria, { $set: orderStatus }, options);
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
    return await Order.findOneAndUpdate({ outTradeNo }, { $set: { status: 'paid', payment } }, options).exec();
  }
}
export default new OrdersRepo();
