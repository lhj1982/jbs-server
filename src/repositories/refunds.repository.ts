import * as mongoose from 'mongoose';
import { RefundSchema } from '../models/refund.model';
const Refund = mongoose.model('Refund', RefundSchema, 'refunds');
mongoose.set('useFindAndModify', false);

class RefundsRepo {
  async findByRefundNo(refundNo, opts = {}) {
    return await Refund.findOne({ outRefundNo: refundNo }, opts)
      .populate('order')
      .exec();
  }

  async getRefundableOrders(filter, opts = {}) {
    const { status } = filter;
    return await Refund.find({ status }, opts)
      .populate('order')
      .exec();
  }

  async findById(id: string) {
    return await Refund.findOne({ _id: id })
      .populate('order')
      .exec();
  }

  async saveOrUpdate(refund, opts = {}) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id, outRefundNo } = refund;
    if (_id) {
      return await Refund.findOneAndUpdate({ _id }, refund, options).exec();
    } else {
      return await Refund.findOneAndUpdate({ outRefundNo }, refund, options).exec();
    }
  }
}

export default new RefundsRepo();
