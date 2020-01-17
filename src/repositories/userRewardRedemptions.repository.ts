import * as mongoose from 'mongoose';
import { UserRewardRedemptionSchema } from '../models/userRewardRedemption.model';
import { CommonRepo } from './common.repository';
const UserRewardRedemption = mongoose.model('UserRewardRedemption', UserRewardRedemptionSchema);
mongoose.set('useFindAndModify', false);

class UserRewardRedemptionsRepo extends CommonRepo {
  async getTotalRedemptionPointsByUser(expiredAt) {
    return null;
  }

  async findUnique(params) {
    return await UserRewardRedemption.where(params)
      .findOne()
      .exec();
  }

  async saveOrUpdate(userRewardRedemption, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, rewardRedemption, voucherCode } = userRewardRedemption;
    return await UserRewardRedemption.findOneAndUpdate({ user, rewardRedemption, voucherCode }, userRewardRedemption, options).exec();
  }
}

export default new UserRewardRedemptionsRepo();
