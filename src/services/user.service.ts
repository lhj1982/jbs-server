import config from '../config';
import logger from '../utils/logger';
import { pp } from '../utils/stringUtil';
import { nowDate, addDays2, date2String } from '../utils/dateUtil';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import UserTagsRepo from '../repositories/userTags.repository';
import UserEndorsementsRepo from '../repositories/userEndorsements.repository';
import UserRewardsRepo from '../repositories/userRewards.repository';
import UserRewardRedemptionsRepo from '../repositories/userRewardRedemptions.repository';
import WatchListsRepo from '../repositories/watchLists.repository';
import { ResourceNotFoundException, WrongCredentialException } from '../exceptions/custom.exceptions';
const WXBizDataCrypt = require('../utils/WXBizDataCrypt');

class UserService {
  async findById(id: string) {
    try {
      const user = await UsersRepo.findById(id);
      if (!user) {
        throw new ResourceNotFoundException('User', id);
      }
      const { shopStaffs } = user;
      const shops = shopStaffs.map(_ => {
        const { shop } = _;
        return shop;
      });
      const watchList = await WatchListsRepo.find({
        user: user._id,
        type: 'script_interested'
      });
      const watches = watchList.map(_ => {
        const { scriptObj } = _;
        return scriptObj;
      });
      const userObj = user.toObject();
      delete userObj.shopStaffs;
      return { ...userObj, shops, watches };
    } catch (err) {
      throw err;
    }
  }

  async findOneByParams(params) {
    try {
      const user = await UsersRepo.findOne(params);
      if (user) {
        const { shopStaffs } = user;
        const shops = shopStaffs.map(_ => {
          const { shop } = _;
          return shop;
        });
        const userObj = user.toObject();
        delete userObj.shopStaffs;
        return { ...userObj, shops };
      } else {
        return undefined;
      }
    } catch (err) {
      throw err;
    }
  }

  async findByUserNameAndPassword(username: string, password: string) {
    try {
      const user = await UsersRepo.findByUserNameAndPassword(username, password);
      if (!user) {
        throw new WrongCredentialException(username, password);
      }
      const { shopStaffs } = user;
      const shops = shopStaffs.map(_ => {
        const { shop } = _;
        return shop;
      });
      const userObj = user.toObject();
      delete userObj.shopStaffs;
      return { ...userObj, shops };
    } catch (err) {
      throw err;
    }
  }

  /**
   * 1. check user session key
   * 2. if it's expired, request a new one.
   * 3. use the session key to get encrypted data decrypted
   *
   * @param {[type]} user [description]
   * @param {[type]} data [description]
   */
  async getWechatEncryptedData(data) {
    logger.info(`${pp(data)}`);
    // const session = await UsersRepo.getSession();
    // session.startTransaction();
    try {
      // const opts = { session };
      const { encryptedData, iv, sessionKey } = data;
      const { appId } = config;
      const newWBDC = new WXBizDataCrypt(appId, sessionKey);

      const resultPhone = newWBDC.decryptData(encryptedData, iv);
      const result = {
        phoneNumber: resultPhone.phoneNumber,
        countryCode: resultPhone.countryCode
      };
      // await session.commitTransaction();
      // await UsersRepo.endSession();
      return result;
    } catch (err) {
      // await session.abortTransaction();
      // await UsersRepo.endSession();
    }
  }

  async addUserTag(userTag, eventUser) {
    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };

      const newUserTag = await UserTagsRepo.saveOrUpdate(userTag, opts);
      await session.commitTransaction();
      await UsersRepo.endSession();

      // update eventUser tags after successfully update user tags
      const eventUserTags = await this.getEventUserTags(newUserTag);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        tags: eventUserTags
      });
      // console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);
      const { taggedBy, objectId } = userTag;
      const rewardToAdd = {
        user: taggedBy,
        objectId,
        type: 'user_tagged',
        points: 2
      };
      await this.saveUserRewardsForEndorsementAndTag(rewardToAdd, opts);
      return newUserTag;
    } catch (err) {
      console.error(err);
      await session.abortTransaction();
      await UsersRepo.endSession();
      throw err;
    }
  }

  async endorseUser(endorsement, eventUser, options = {}) {
    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      // console.log(eventUser);
      const userEndorsement = await UserEndorsementsRepo.saveOrUpdate(endorsement, opts);
      await session.commitTransaction();
      await UsersRepo.endSession();

      // update eventUser number of endorsements after successfully update user endorsements
      const endorsements = await this.getEventUserEndorsement(endorsement);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        endorsements
      });
      // console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);
      const { endorsedBy, objectId } = endorsement;
      const rewardToAdd = {
        user: endorsedBy,
        objectId,
        type: 'user_endorsed',
        points: 1
      };
      await this.saveUserRewardsForEndorsementAndTag(rewardToAdd, opts);
      await UserRewardsRepo.saveOrUpdate(rewardToAdd, opts);

      return userEndorsement;
    } catch (err) {
      await session.abortTransaction();
      await UsersRepo.endSession();
      throw err;
    }
  }

  async unendorseUser(endorsement, eventUser, options = {}) {
    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      // console.log(eventUser);
      const userEndorsement = await UserEndorsementsRepo.delete(endorsement, opts);
      await session.commitTransaction();
      await UsersRepo.endSession();

      // update eventUser number of endorsements after successfully update user endorsements
      const endorsements = await this.getEventUserEndorsement(endorsement);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        endorsements
      });
      // console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);
      const { endorsedBy, objectId } = endorsement;
      const rewardToRemove = {
        user: endorsedBy,
        objectId,
        type: 'user_endorsed',
        points: 1
      };
      await UserRewardsRepo.delete(rewardToRemove, opts);
      return userEndorsement;
    } catch (err) {
      await session.abortTransaction();
      await UsersRepo.endSession();
      throw err;
    }
  }

  /**
   * Get tags for given event user.
   *
   * return data is like
   *
   * [ { count: 1, tag: 5de6859193c0f4662f4374e7 } ]
   *
   * @param {any} userTag [description]
   */
  async getEventUserTags(userTag: any) {
    const { type, taggedBy, tag, user, objectId } = userTag;
    const userTags = await UserTagsRepo.findByUser({ user, type, objectId });
    return userTags;
  }

  async getEventUserEndorsement(endorsement: any) {
    const { type, endorsedBy, user, objectId } = endorsement;
    const endorsements = await UserEndorsementsRepo.findByUser({
      type,
      objectId,
      user
    });
    return endorsements;
  }

  async saveUserRewardsForEndorsementAndTag(reward, options = {}) {
    const { user } = reward;
    const now = nowDate();
    // const expiredDate = addDays2(now, 365);
    const rewardToAdd = Object.assign(reward, {
      createdAt: now,
      updatedAt: now
      // expiredAt: expiredDate
    });
    logger.info(`Save user reward for endorsement and tag, user ${user}`);
    return await UserRewardsRepo.saveOrUpdate(rewardToAdd, options);
  }

  /**
   * Save user rewards when an event is completed.
   *
   * @param {[type]} event     [description]
   */
  async saveUserRewardsWhenEventCompleted(event, options = {}) {
    const {
      _id: eventId,
      hostUser: { _id: hostUserId },
      members
    } = event;
    const now = nowDate();
    // const expiredDate = addDays2(now, 365);
    let result = [];
    result.push(
      await UserRewardsRepo.saveOrUpdate(
        {
          type: 'host_event_completed',
          user: hostUserId,
          objectId: eventId,
          createdAt: now,
          updatedAt: now,
          // expiredAt: expiredDate,
          points: 50
        },
        options
      )
    );
    logger.info(`Save user reward for host event, user ${hostUserId}`);
    const promises = members.map(async member => {
      const {
        _id: eventUserId,
        status,
        user: { _id: userId }
      } = member;
      if (status === 'paid') {
        logger.info(`Save user reward for join event, user ${userId}`);
        return await UserRewardsRepo.saveOrUpdate(
          {
            type: 'join_event_completed',
            user: userId,
            objectId: eventUserId,
            createdAt: now,
            updatedAt: now,
            // expiredAt: expiredDate,
            points: 15
          },
          options
        );
      } else {
        return new Promise(resolve => {
          resolve(undefined);
        });
      }
    });
    result = result.concat(await Promise.all(promises));
    return result;
  }

  async updateTagsAndEndorsements() {
    const userEndorsements = await UserEndorsementsRepo.updateAllEndorsementGroupByUser('');
    await UserTagsRepo.updateAllTagsGroupByUser('');
    return userEndorsements;
  }

  async updateCredits() {
    const expiredAt = nowDate().toDate();
    const userRewards = await UserRewardsRepo.getTotalRewardPointsByUser(expiredAt);
    const userRewardsRedemptions = await UserRewardRedemptionsRepo.getTotalRedemptionPointsByUser(expiredAt);
    // const users = await UsersRepo.find({
    //   status: 'active',
    //   openId: { $ne: null }
    // });
    // // console.log(userRewards);
    // const promises = users.map(async user => {
    //   await this.updateCredit(user, userRewards, userRewardsRedemptions);
    // });
    // return await Promise.all(promises);
    const usersToUpdate = this.getUpdatedUsers(userRewards, userRewardsRedemptions);
    const result = await this.updateCredit(usersToUpdate);
    logger.info(pp(result));
    // await this.updateRewardRedemptionCredits(userRewardsRedemptions);

    return usersToUpdate;
  }

  getUpdatedUsers(userRewards, userRewardsRedemptions) {
    const result = userRewards.map(userReward => {
      const { userObj: user, totalPoints } = userReward;
      const { _id: userId } = user;
      return { userId, gain: totalPoints };
    });
    userRewardsRedemptions.forEach(userRewardRedemption => {
      const { userObj: user, totalPoints } = userRewardRedemption;
      const { _id: userId1 } = user;
      let matched = 0;
      for (let i = 0; i < result.length; i++) {
        let entry = result[i];
        const { userId: userId2, gain } = entry;
        if (userId1.toString() === userId2.toString()) {
          matched = 1;
          entry = Object.assign(entry, { spend: totalPoints });
          break;
        }
      }
      if (!matched) {
        result.push({ userId: userId1, spend: totalPoints });
      }
    });
    return result;
  }

  async updateCredit(usersToUpdate): Promise<any> {
    return await UsersRepo.batchUpdateCredits(usersToUpdate);
  }
}

export default new UserService();
