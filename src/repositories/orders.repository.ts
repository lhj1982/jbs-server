import * as mongoose from 'mongoose';
import { escapeRegex } from '../utils/stringUtil';
import { OrderSchema } from '../models/order.model';
import { CommonRepo } from './common.repository';
import { string2Date } from '../utils/dateUtil';
const Order = mongoose.model('Order', OrderSchema, 'orders');
mongoose.set('useFindAndModify', false);

class OrdersRepo extends CommonRepo {
  async getSession() {
    return super.getSession(Order);
  }

  async endSession() {
    super.endSession();
  }

  async find(params) {
    const { offset, limit, outTradeNo, type, objectId, createdBy } = params;
    // let condition = { outTradeNo };
    let condition = {};
    if (outTradeNo) {
      const regex = new RegExp(escapeRegex(outTradeNo), 'gi');
      condition = { outTradeNo: regex };
    }
    if (type) {
      condition['type'] = type;
    }
    if (objectId) {
      condition['objectId'] = objectId;
    }
    if (createdBy) {
      condition['createdBy'] = createdBy;
    }

    const total = await Order.find(condition)
      .countDocuments({})
      .exec();
    const pagination = { offset, limit, total };
    const pagedOrders = await Order.find(condition)
      .populate({
        path: 'refunds',
        populate: {
          path: 'user',
          select: '-sessionKey -password -roles'
        }
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
    return { pagination, data: pagedOrders };
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Order.findById(mongoose.Types.ObjectId(id))
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .populate('refunds')
      .exec();
  }

  // async findUnique(params) {
  //   return await Order.findOne(params).exec();
  // }
  async findByParams(params) {
    return await Order.findOne(params).exec();
  }

  async findByTradeNo(outTradeNo: string) {
    return await Order.findOne({ outTradeNo })
      .populate('createdBy', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
      .populate('refunds')
      .exec();
  }

  async getRefundableOrders(filter, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { orderStatus } = filter;
    return await Order.find({ orderStatus }).exec();
  }

  /**
   * Used for admin report system.
   *
   * @param {any = {}} params [description]
   */
  async getOrders(params: any = {}) {
    const { shopName, fromDate, toDate, statuses, limit, offset } = params;
    const aggregate: any[] = [
      {
        $match: {
          createdAt: {
            $gte: string2Date(fromDate).toDate(),
            $lt: string2Date(toDate).toDate()
          }
        }
      },
      {
        $addFields: {
          convertedObjectId: {
            $toObjectId: '$objectId'
          }
        }
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'order',
          as: 'refunds'
        }
      },
      {
        $lookup: {
          from: 'eventUsers',
          localField: 'convertedObjectId',
          foreignField: '_id',
          as: 'booking'
        }
      },
      {
        $unwind: {
          path: '$booking',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'booking.event',
          foreignField: '_id',
          as: 'booking.eventObj'
        }
      },
      {
        $unwind: {
          path: '$booking.eventObj',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'booking.eventObj.status': { $in: statuses }
        }
      },
      {
        $lookup: {
          from: 'shops',
          localField: 'booking.eventObj.shop',
          foreignField: '_id',
          as: 'booking.eventObj.shopObj'
        }
      },
      {
        $unwind: {
          path: '$booking.eventObj.shopObj',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'eventCommissions',
          localField: 'booking.eventObj._id',
          foreignField: 'event',
          as: 'booking.eventObj.commissions'
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          _id: 0,
          convertedObjectId: 0,
          'booking.eventObj.shop': 0,
          'booking.event': 0
        }
      }
    ];
    if (shopName) {
      const regex = new RegExp(escapeRegex(shopName), 'gi');
      const shopMatch = { $match: { 'booking.eventObj.shopObj.name': regex } };
      // const match['booking.eventObj.shopObj.name'] = {$regex: ''};
      aggregate.push(shopMatch);
    }

    // console.log(aggregate);
    const result = await Order.aggregate([...aggregate, { $count: 'total' }]).exec();
    let total = 0;
    if (result.length > 0) {
      total = result[0];
    }
    // console.log(total);
    const data = await Order.aggregate([...aggregate, { $skip: offset }, { $limit: limit }]).exec();
    // console.log(data);
    const pagination = { offset, limit, total };
    return { pagination, data };
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

  async updatePaymentByTradeNo(order, opts = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id, outTradeNo } = order;
    if (_id) {
      return await Order.findOneAndUpdate({ _id }, order, options).exec();
    } else {
      return await Order.findOneAndUpdate({ outTradeNo }, order, options).exec();
    }
  }
}
export default new OrdersRepo();
