import * as mongoose from 'mongoose';
import { UserRewardSchema } from '../models/userReward.model';
import { CommonRepo } from './common.repository';
const UserReward = mongoose.model('UserReward', UserRewardSchema);
mongoose.set('useFindAndModify', false);

class UserRewardsRepo extends CommonRepo {
  async getTotalRewardPointsByUser(expiredAt) {
    const userRewards = await UserReward.aggregate([
      {
        $match: {
          $or: [{ expiredAt: { $gte: new Date() } }, { expiredAt: { $eq: null } }]
        }
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

    return userRewards;
  }

  async delete(userReward, opt = {}) {
    const options = {
      ...opt
    };
    const { user, type, objectId, points } = userReward;
    return await UserReward.findOneAndRemove({ user, type, objectId, points }, options).exec();
  }

  async saveOrUpdate(userReward, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, type, objectId, points } = userReward;
    return await UserReward.findOneAndUpdate({ user, type, objectId, points }, userReward, options).exec();
  }
}

export default new UserRewardsRepo();
