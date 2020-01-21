import { ResourceNotFoundException, ResourceAlreadyExist, InvalidRequestException, InsufficientCreditsException, InsufficientRedemptionsException } from '../exceptions/custom.exceptions';
import RewardRedemptionsRepo from '../repositories/rewardRedemptions.repository';
import UserRewardRedemptionsRepo from '../repositories/userRewardRedemptions.repository';
import ExternalCustomersRepo from '../repositories/externalCustomers.repository';
import UsersRepo from '../repositories/users.repository';
import { nowDate, addDays2, date2String } from '../utils/dateUtil';
import { getRandomString } from '../utils/stringUtil';
import logger from '../utils/logger';
class RewardService {
  async getRewardRedemptions(params) {
    return await RewardRedemptionsRepo.find(params);
  }

  async createRewardRedemption(params) {
    const { externalCustomerId, type, title, subtitle, description, points, quantity, scope, validPeriod, reminder, instruction1, instruction2, note, imageUrl } = params;
    const externalCustomer = await ExternalCustomersRepo.findById(externalCustomerId);
    if (!externalCustomer) {
      throw new ResourceNotFoundException('ExternalCustomer', externalCustomerId);
    }
    if (!type || !title || !subtitle || !points || !quantity) {
      throw new InvalidRequestException('RewardRedeption', ['type', 'title', 'subtitle', 'points', 'quantity']);
    }
    const session = await RewardRedemptionsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const rewardRedemptionToAdd = {
        externalCustomer: externalCustomerId,
        type,
        title,
        subtitle,
        description,
        points,
        quantity,
        available: quantity,
        scope,
        validPeriod,
        reminder,
        instruction1,
        instruction2,
        note,
        imageUrl,
        status: 'active'
      };
      const rewardRedemption = await RewardRedemptionsRepo.findUnique(rewardRedemptionToAdd);
      if (rewardRedemption) {
        throw new ResourceAlreadyExist('RewardRedemption', rewardRedemption._id);
      }
      const newRewardRedeption = await RewardRedemptionsRepo.saveOrUpdate(rewardRedemptionToAdd, opts);
      logger.info(`Creating ${quantity} vouchers...`);
      await UserRewardRedemptionsRepo.batchCreateVouchers(newRewardRedeption, opts);

      await session.commitTransaction();
      await RewardRedemptionsRepo.endSession();
      return newRewardRedeption;
    } catch (err) {
      await session.abortTransaction();
      await RewardRedemptionsRepo.endSession();
      throw err;
    }
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
      let userRewardRedemption = await UserRewardRedemptionsRepo.findAvailableOneByRewardRedemption(rewardRedemptionId);
      if (!userRewardRedemption) {
        throw new InsufficientRedemptionsException(rewardRedemptionId, 'All vouchers are taken');
      } else {
        const now = nowDate();
        const expired = addDays2(now, 365);
        const voucherCode = getRandomString(24);
        const opts = { session };
        const dataToAdd = Object.assign(userRewardRedemption.toObject(), {
          user: userId,
          createdAt: now,
          expiredAt: expired
        });
        // let userRewardRedemption = await UserRewardRedemptionsRepo.findUnique({
        //   user,
        //   rewardRedemption,
        //   voucherCode
        // });
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
