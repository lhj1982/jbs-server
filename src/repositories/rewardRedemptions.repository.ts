import * as mongoose from 'mongoose';
import { RewardRedemptionSchema } from '../models/rewardRedemption.model';
import { CommonRepo } from './common.repository';
const RewardRedemption = mongoose.model('RewardRedemption', RewardRedemptionSchema);
mongoose.set('useFindAndModify', false);

class RewardRedemptionsRepo extends CommonRepo {
  async getSession() {
    return super.getSession(RewardRedemption);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string) {
    return await RewardRedemption.where({ _id: id })
      .findOne()
      .populate('externalCustomer')
      .exec();
  }

  async find(params) {
    return await RewardRedemption.find(params)
      .populate('externalCustomer')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnique(params) {
    const { externalCustomer, type, title, subtitle } = params;
    return await RewardRedemption.where({
      externalCustomer,
      type,
      title,
      subtitle
    })
      .findOne()
      .exec();
  }

  async saveOrUpdate(rewardRedemption, opt = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { externalCustomer, type, title, subtitle } = rewardRedemption;
    return await RewardRedemption.findOneAndUpdate({ externalCustomer, type, title, subtitle }, rewardRedemption, options);
  }
}

export default new RewardRedemptionsRepo();
