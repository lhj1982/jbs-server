import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
import { EventSchema } from '../models/event.model';
import { EventUserSchema } from '../models/eventUser.model';
import { PriceWeeklySchemaSchema } from '../models/priceWeeklySchema.model';
import { DiscountRuleSchema } from '../models/discountRule.model';
import { EventCommissionSchema } from '../models/eventCommissions.model';
import { CommonRepo } from './common.repository';
import * as moment from 'moment';
import { escapeRegex } from '../utils/stringUtil';
import { nowDate, string2Date } from '../utils/dateUtil';
const Event = mongoose.model('Event', EventSchema, 'events');
const EventUser = mongoose.model('EventUser', EventUserSchema, 'eventUsers');
const PriceWeeklySchema = mongoose.model('PriceWeeklySchema', PriceWeeklySchemaSchema, 'priceWeeklySchema');
const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
const EventCommission = mongoose.model('EventCommission', EventCommissionSchema, 'eventCommissions');

mongoose.set('useFindAndModify', false);

class EventsRepo extends CommonRepo {
  async getSession() {
    return super.getSession(Event);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string, filter = { status: ['ready', 'completed', 'expired'] }) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    const { status } = filter;
    return await Event.where({ _id: id, status: { $in: status } })
      .findOne()
      .populate('script')
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
      .populate('hostUser', ['-password', '-sessionKey'])
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } },
        populate: [
          {
            path: 'user',
            select: '-password -sessionKey'
          },
          {
            path: 'tags',
            populate: {
              path: 'tag'
            },
            select: '-user -objectId -type'
          },
          {
            path: 'endorsements',
            select: '-user -objectId -type'
          }
        ]
      })
      .populate('discountRule')
      .populate({
        path: 'commissions'
      })
      .exec();
  }

  async findByIdSimplified(id: string, filter = { status: ['ready', 'completed', 'expired'] }) {
    const { status } = filter;
    return await Event.where({ _id: id, status: { $in: status } })
      .findOne()
      .populate('script')
      .populate('shop', ['name', 'key'])
      .populate('hostUser', ['-password', '-sessionKey'])
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } },
        populate: {
          path: 'user',
          select: '-password -sessionKey'
        },
        select: 'source status mobile wechatId createdAt numberOfEndorsements tags'
      })
      .populate({
        path: 'commissions'
      })
      .exec();
  }

  async findPriceWeeklySchemaByEvent(scriptId: string, shopId: string) {
    return await PriceWeeklySchema.find(
      {
        script: scriptId,
        shop: shopId
      },
      { _id: 0, priceSchema: 1, createdAt: 1, updatedAt: 1 }
    )
      .findOne()
      .exec();
  }

  async find(params, filter = { status: ['ready'], availableSpots: -1 }, sort = undefined) {
    const { status, availableSpots } = filter;
    const { offset, limit, keyword, scriptId, shopId } = params;
    const condition = {
      status: { $in: status }
    };
    if (scriptId) {
      condition['script'] = scriptId;
    }
    if (shopId) {
      condition['shop'] = shopId;
    }
    if (availableSpots !== -1) {
      condition['minNumberOfAvailableSpots'] = { $lte: availableSpots, $gt: 0 };
      condition['numberOfOfflinePersons'] = { $eq: 0 };
    }
    // console.log(condition);
    // const total = await Event.countDocuments(condition).exec();

    let sortObj = { startTime: 1 };
    if (sort) {
      sortObj = Object.assign({}, sort);
    }
    let pagination = undefined;
    let pagedEvents = [];
    if (keyword) {
      const rawEvents = await Promise.all([this.getEventsFilteredByScriptName(keyword, condition), this.getEventsFilteredByHostName(keyword, condition)]);
      const events = this.mergeUniqueArray(rawEvents[0], rawEvents[1], 1);
      pagination = { offset, limit, total: events.length };
      pagedEvents = events.slice(offset, offset + limit);
    } else {
      // get all matched events, filter away those have null script or shop
      let events = await Event.find(condition)
        .populate('script')
        .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
        .populate('hostUser', ['-password', '-sessionKey'])
        .populate('commissions')
        .populate({
          path: 'members',
          match: { status: { $in: ['unpaid', 'paid'] } }
        })
        .sort(sortObj)
        .exec();
      events = events.filter(event => {
        const { script, shop } = event;
        return script != null && shop != null;
      });
      pagination = { offset, limit, total: events.length };
      pagedEvents = events.slice(offset, offset + limit);
    }
    return { pagination, data: pagedEvents };
  }

  async getEventsFilteredByScriptName(keyword: string, condition: any) {
    const regex = new RegExp(escapeRegex(keyword), 'gi');
    let events = await Event.find(condition)
      .populate({
        path: 'script',
        match: { name: regex }
      })
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
      .populate('hostUser', ['-password', '-sessionKey'])
      .populate('commissions')
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } }
      })
      .sort({ startTime: 1 })
      .exec();
    events = events.filter(event => {
      const { script, shop } = event;
      return script != null && shop != null;
    });
    // console.log(events);
    return events;
  }

  async getEventsFilteredByHostName(keyword: string, condition: any) {
    const regex = new RegExp(escapeRegex(keyword), 'gi');
    let events = await Event.find(condition)
      .populate('script')
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
      .populate({
        path: 'hostUser',
        match: { nickName: regex },
        select: '-password -sessionKey'
      })
      .populate('commissions')
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } }
      })
      .sort({ startTime: 1 })
      .exec();
    events = events.filter(event => {
      const { script, shop, hostUser } = event;
      return script != null && shop != null && hostUser != null;
    });
    return events;
  }

  async findByDate(fromDate: moment.Moment, toDate: moment.Moment, filter: any = { status: ['ready', 'completed', 'expired'] }) {
    const condition = {
      startTime: {
        $gte: fromDate,
        $lte: toDate
      }
    };
    const { status } = filter;
    if (status) {
      condition['status'] = {
        $in: status
      };
    }
    // console.log(condition);
    return await Event.find(condition)
      .populate('script')
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
      .populate('hostUser', ['-password', '-sessionKey'])
      .populate('script')
      .sort({ startTime: 1 })
      .exec();
  }

  async findEventsCountByDates(from: moment.Moment, to: moment.Moment, filter: any = { status: ['ready', 'completed', 'expired'] }) {
    const { status } = filter;
    return await Event.aggregate([
      {
        $project: {
          _id: 1,
          startTime: 1,
          status: 1,
          startDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startTime',
              timezone: '+08:00'
            }
          }
        }
      },
      {
        $match: {
          status: { $in: status },
          startTime: { $gte: from.toDate(), $lte: to.toDate() }
        }
      },
      {
        $group: {
          _id: '$startDate',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          startDate: '$_id',
          numberOfEvents: '$count'
        }
      }
    ]).exec();
  }

  /**
   * Used for report.
   *
   */
  async getEvents(params: any = {}) {
    const { shopName, fromDate, toDate, statuses, limit, offset } = params;
    const aggregate: any[] = [
      {
        $match: {
          startTime: {
            $gte: string2Date(fromDate).toDate(),
            $lt: string2Date(toDate).toDate()
          },
          status: {
            $in: statuses
          }
        }
      },
      {
        $lookup: {
          from: 'eventUsers',
          localField: '_id',
          foreignField: 'event',
          as: 'members'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'hostUser',
          foreignField: '_id',
          as: 'hostUserObj'
        }
      },
      {
        $unwind: {
          path: '$hostUserObj',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'shops',
          localField: 'shop',
          foreignField: '_id',
          as: 'shopObj'
        }
      },
      {
        $unwind: {
          path: '$shopObj',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'scripts',
          localField: 'script',
          foreignField: '_id',
          as: 'scriptObj'
        }
      },
      {
        $unwind: {
          path: '$scriptObj',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'eventCommissions',
          localField: '_id',
          foreignField: 'event',
          as: 'commissions'
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
          shop: 0,
          script: 0,
          hostUser: 0,
          'hostUserObj.password': 0,
          'hostUserObj.roles': 0,
          'hostUserObj.sessionKey': 0
        }
      }
    ];
    if (shopName) {
      const regex = new RegExp(escapeRegex(shopName), 'gi');
      const shopMatch = { $match: { 'shopObj.name': regex } };
      // const match['booking.eventObj.shopObj.name'] = {$regex: ''};
      aggregate.push(shopMatch);
    }
    const result = await Event.aggregate([...aggregate, { $count: 'total' }]).exec();
    let total = 0;
    if (result.length > 0) {
      total = result[0];
    }
    // console.log(total);
    const data = await Event.aggregate([...aggregate, { $skip: offset }, { $limit: limit }]).exec();
    // console.log(data);
    const pagination = { offset, limit, total };
    return { pagination, data };
  }

  async findOne(params) {
    return await Event.where(params)
      .findOne()
      .exec();
  }

  async getMostHostEventCount() {
    const events = await Event.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$hostUser',
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $addFields: { user: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $limit: 1
      }
    ]).exec();
    let result = undefined;
    if (events.length > 0) {
      result = events[0];
    }
    return result;
  }

  async getMostJoinEventCountByGender(gender: string) {
    const events = await EventUser.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventObj'
        }
      },
      {
        $unwind: {
          path: '$eventObj'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userObj'
        }
      },
      {
        $unwind: {
          path: '$userObj'
        }
      },
      {
        $match: {
          status: 'paid',
          'eventObj.status': 'completed',
          'userObj.gender': gender,
          $expr: { $ne: ['$eventObj.hostUser', '$userObj._id'] }
        }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      {
        $addFields: { user: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit: 2
      }
    ]).exec();
    let result = undefined;
    if (events.length > 0) {
      result = events[0];
    }

    return result;
  }

  async saveEventCommissions(commissions, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { event } = commissions;
    return await EventCommission.findOneAndUpdate({ event }, commissions, options).exec();
  }

  async saveOrUpdate(event, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id: eventId, shop, script, startTime, endTime, hostUser, status, createdAt } = event;
    if (eventId) {
      return await Event.findOneAndUpdate({ _id: eventId }, event, options).exec();
    } else if (status === 'ready') {
      return await Event.findOneAndUpdate({ shop, script, startTime, status, hostUser }, event, options).exec();
    } else {
      return await Event.findOneAndUpdate({ shop, script, startTime, hostUser, createdAt }, event, options).exec();
    }
  }

  async findDiscountRulesByShopAndScript(shopId: string, scriptId?: string) {
    const condition = { shop: shopId };
    if (scriptId) {
      condition['script'] = scriptId;
    }
    return await DiscountRule.find(condition, {
      _id: 0,
      rules: 1,
      createdAt: 1,
      updatedAt: 1
    }).exec();
  }

  async findEventsByUser(userId: string, filter: any = { status: ['ready', 'completed', 'expired'] }) {
    const condition = { hostUser: userId };
    const { status } = filter;
    if (status) {
      condition['status'] = {
        $in: status
      };
    }
    const myHostEvents = await Event.find(condition)
      .populate('hostUser', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language'])
      .populate({
        path: 'members',
        match: { status: { $in: ['unpaid', 'paid'] } },
        populate: {
          path: 'user',
          select: '_id openId nickName avatarUrl gender country province city language mobile wechatId ageTag'
        }
      })
      .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
      .populate('script')
      .sort({ startTime: 1 })
      .exec();
    const eventsUserJoined = (
      await Event.find({ status: { $in: status } })
        .populate('hostUser', ['_id', 'openId', 'nickName', 'avatarUrl', 'gender', 'country', 'province', 'city', 'language', 'mobile', 'wechatId', 'ageTag'])
        .populate({
          path: 'members',
          match: { user: userId, status: { $in: ['unpaid', 'paid'] } },
          populate: {
            path: 'user',
            select: '_id openId nickName avatarUrl gender country province city language mobile wechatId ageTag'
          }
        })
        .populate('shop', ['_id', 'name', 'key', 'address', 'mobile', 'phone', 'wechatId', 'wechatName', 'supportedPaymentMethods'])
        .populate('script')
        .sort({ startTime: 1 })
        .exec()
    ).filter(event => {
      const { members } = event;
      return members.length > 0;
    });

    const userEvents = myHostEvents;
    for (let i = 0; i < eventsUserJoined.length; i++) {
      const event1 = eventsUserJoined[i];
      let duplicated = false;
      for (let j = 0; j < userEvents.length; j++) {
        const event2 = userEvents[j];
        if (event2._id.toString() === event1._id.toString()) {
          duplicated = true;
          break;
        }
      }
      if (!duplicated) {
        userEvents.push(event1);
      }
    }
    return userEvents.sort(this.compareDesc);
  }

  /**
   * @param {any[]}     e1 [description]
   * @param {any[]}     e2 [description]
   * @param {number =  1}           sort 1 - asc; -1 - desc
   */
  mergeUniqueArray(e1: any[], e2: any[], sort = 1) {
    const result = e1;
    for (let i = 0; i < e2.length; i++) {
      const event2 = e2[i];
      let duplicated = false;
      for (let j = 0; j < result.length; j++) {
        const event1 = e1[j];
        if (event2._id.toString() === event1._id.toString()) {
          duplicated = true;
          break;
        }
      }
      if (!duplicated) {
        result.push(event2);
      }
    }
    return sort === 1 ? result.sort(this.compareAsc) : result.sort(this.compareDesc);
  }

  compareAsc(a, b) {
    // Use toUpperCase() to ignore character casing
    const { startTime: startTimeA } = a;
    const { startTime: startTimeB } = b;
    let comparison = 0;
    if (startTimeA > startTimeB) {
      comparison = 1;
    } else if (startTimeA < startTimeB) {
      comparison = -1;
    }
    return comparison;
  }

  compareDesc(a, b) {
    // Use toUpperCase() to ignore character casing
    const { startTime: startTimeA } = a;
    const { startTime: startTimeB } = b;
    let comparison = 0;
    if (startTimeA > startTimeB) {
      comparison = -1;
    } else if (startTimeA < startTimeB) {
      comparison = 1;
    }
    return comparison;
  }

  // async updateExpiredEvents(opt: object = {}) {
  //   const now = nowDate();
  //   console.log(now);

  //   const condition = {
  //     endTime: { $lt: now },
  //     status: 'ready'
  //   };
  //   return await Event.findAndModify(condition, {
  //     $set: { status: 'expired' }
  //   }).exec();
  // }

  /**
   * Only archive event when
   * 1. startTime is past
   * 2. status is ready
   * 3. not full
   * @param {object = {}} opt [description]
   */
  async archiveEvents(opt: object = {}) {
    const options = {
      ...opt,
      upsert: false,
      new: true
    };
    console.log(nowDate());
    const condition = {
      startTime: { $lt: nowDate() },
      status: { $in: ['ready'] },
      minNumberOfAvailableSpots: { $gt: 0 }
    };
    const events = await Event.find(condition).exec();
    const eventIds = events.map(_ => _.id);
    const response = await Event.updateMany(condition, { status: 'expired' }, options).exec();
    const { nModified: affectedRows } = response;
    return { eventIds, affectedRows };
  }
}
export default new EventsRepo();
