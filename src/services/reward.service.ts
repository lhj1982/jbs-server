import RewardRedemptionsRepo from '../repositories/rewardRedemptions.repository';

class RewardService {
  async getRewardRedemptions(params) {
    return await RewardRedemptionsRepo.find(params);
  }
}

export default new RewardService();
