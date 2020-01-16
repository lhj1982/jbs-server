import * as mongoose from 'mongoose';
import { UserRewardRedemptionSchema } from '../models/userRewardRedemption.model';
import { CommonRepo } from './common.repository';
const UserRewardRedemption = mongoose.model('UserRewardRedemption', UserRewardRedemptionSchema);
mongoose.set('useFindAndModify', false);

class UserRewardRedemptionsRepo extends CommonRepo {
  async getTotalRedemptionPointsByUser(expiredAt) {
    return null;
  }

  async saveOrUpdate(userRewardRedemption, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, type, status, voucherCode } = userRewardRedemption;
    return await UserRewardRedemption.findOneAndUpdate({ user, type, status, voucherCode }, userRewardRedemption, options).exec();
  }
}

export default new UserRewardRedemptionsRepo();
