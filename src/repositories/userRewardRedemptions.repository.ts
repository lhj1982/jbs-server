import * as mongoose from 'mongoose';
import { UserRewardRedemptionSchema } from '../models/userRewardRedemption.model';
import { CommonRepo } from './common.repository';
import { nowDate, addDays2 } from '../utils/dateUtil';
import { getRandomString } from '../utils/stringUtil';
const UserRewardRedemption = mongoose.model('UserRewardRedemption', UserRewardRedemptionSchema);
mongoose.set('useFindAndModify', false);

class UserRewardRedemptionsRepo extends CommonRepo {
  async getTotalRedemptionPointsByUser(expiredAt) {
    return await UserRewardRedemption.aggregate([
      {
        $match: { user: { $ne: null } }
      },
      {
        $group: {
          _id: '$user',
          totalPoints: {
            $sum: '$points'
          }
        }
      },
      {
        $addFields: { user: '$_id' }
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
        $project: { _id: 0 }
      }
    ]).exec();
  }

  async findUnique(params) {
    return await UserRewardRedemption.where(params)
      .findOne()
      .exec();
  }

  async findAvailableOneByRewardRedemption(rewardRedepmtionId, opts = {}) {
    return await UserRewardRedemption.where({
      rewardRedemption: rewardRedepmtionId,
      status: 'created',
      user: { $eq: null }
    })
      .findOne()
      .exec();
  }

  /**
   * Batch create x number of vouchers for users to apply.
   *
   * @param {[type]} rewardRedemption [description]
   * @param {[type]} opts             =             {} [description]
   */
  async batchCreateVouchers(rewardRedemption, opts = {}) {
    const { _id: rewardRedemptionId, points, quantity } = rewardRedemption;
    return new Promise((resolve, reject) => {
      if (quantity === 0) {
        resolve();
      } else {
        const now = nowDate();
        const expired = addDays2(now, 365);

        const bulk = UserRewardRedemption.collection.initializeUnorderedBulkOp();
        for (let i = 0; i < quantity; i++) {
          const voucherCode = getRandomString(24);
          bulk.insert({
            rewardRedemption: rewardRedemptionId,
            points,
            voucherCode,
            status: 'created',
            createdAt: now.toDate(),
            expiredAt: expired.toDate()
          });
        }
        bulk.execute((err, bulkres) => {
          if (err) {
            return reject(err);
          } else {
            // console.log(bulkres);
            resolve(bulkres);
          }
        });
      }
    });
  }

  async saveOrUpdate(userRewardRedemption, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id, user, rewardRedemption, voucherCode } = userRewardRedemption;
    if (_id) {
      return await UserRewardRedemption.findOneAndUpdate({ _id }, userRewardRedemption, options).exec();
    } else {
      return await UserRewardRedemption.findOneAndUpdate({ user, rewardRedemption, voucherCode }, userRewardRedemption, options).exec();
    }
  }
}

export default new UserRewardRedemptionsRepo();
