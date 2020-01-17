import * as mongoose from 'mongoose';
import { RewardRedemptionSchema } from '../models/rewardRedemption.model';
import { CommonRepo } from './common.repository';
const RewardRedemption = mongoose.model('RewardRedemption', RewardRedemptionSchema);
mongoose.set('useFindAndModify', false);

class RewardRedemptionsRepo extends CommonRepo {
  async find(params) {
    return await RewardRedemption.find(params)
      .populate('externalCustomer')
      .sort({ createdAt: -1 })
      .exec();
  }
}

export default new RewardRedemptionsRepo();
