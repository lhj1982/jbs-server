import { InsufficientCreditsException, InsufficientRedemptionsException } from '../exceptions/custom.exceptions';
import RewardRedemptionsRepo from '../repositories/rewardRedemptions.repository';
import UserRewardRedemptionsRepo from '../repositories/userRewardRedemptions.repository';
import UsersRepo from '../repositories/users.repository';
import { nowDate, addDays2, date2String } from '../utils/dateUtil';
import { getRandomString } from '../utils/stringUtil';
class RewardService {
  async getRewardRedemptions(params) {
    return await RewardRedemptionsRepo.find(params);
  }

  async applyRewardRedemption(rewardRedemption, user) {
    const { _id: rewardRedemptionId, points, available } = rewardRedemption;
    const { _id: userId, credits } = user;
    console.log(credits + ', ' + points);
    if (!credits || credits < points) {
      throw new InsufficientCreditsException(userId, 'No enough credits');
    }
    if (available <= 0) {
      throw new InsufficientRedemptionsException(rewardRedemptionId, 'No enough redemptions');
    }
    const session = await RewardRedemptionsRepo.getSession();
    session.startTransaction();
    try {
      const now = nowDate();
      const expired = addDays2(now, 365);
      const voucherCode = getRandomString(24);
      const opts = { session };
      const dataToAdd = {
        user: userId,
        rewardRedemption: rewardRedemptionId,
        voucherCode,
        points,
        status: 'created',
        createdAt: now,
        expiredAt: expired
      };
      let userRewardRedemption = await UserRewardRedemptionsRepo.findUnique({
        user,
        rewardRedemption,
        voucherCode
      });
      if (!userRewardRedemption) {
        userRewardRedemption = await UserRewardRedemptionsRepo.saveOrUpdate(dataToAdd, opts);
        // update user credits
        const refreshedUser = await UsersRepo.findById(userId);
        const { credits } = refreshedUser;
        const userToUpdate = Object.assign(refreshedUser.toObject(), {
          credits: credits - points
        });
        await UsersRepo.saveOrUpdateUser(userToUpdate, opts);
        await session.commitTransaction();
        await RewardRedemptionsRepo.endSession();
      }
      return userRewardRedemption;
    } catch (err) {
      await session.abortTransaction();
      await RewardRedemptionsRepo.endSession();
      throw err;
    }
  }
}

export default new RewardService();
