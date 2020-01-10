import * as mongoose from 'mongoose';
import { UserRewardSchema } from '../models/userReward.model';
import { CommonRepo } from './common.repository';
const UserReward = mongoose.model('UserReward', UserRewardSchema);
mongoose.set('useFindAndModify', false);

class UserRewardsRepo extends CommonRepo {
  async saveOrUpdate(userReward, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, type, objectId, points, createdAt } = userReward;
    return await UserReward.findOneAndUpdate({ user, type, objectId, points, createdAt }, userReward, options).exec();
  }
}

export default new UserRewardsRepo();
