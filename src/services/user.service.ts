import config from '../config';
import logger from '../utils/logger';
import { pp } from '../utils/stringUtil';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import UserTagsRepo from '../repositories/userTags.repository';
import UserEndorsementsRepo from '../repositories/userEndorsements.repository';
import UserRewardsRepo from '../repositories/userRewards.repository';
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
      if (!user) {
        throw new ResourceNotFoundException('User', params);
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
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, {});
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
      console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, {});

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
      console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, {});

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

  /**
   * Save user rewards.
   *
   * @param {[type]} event     [description]
   * @param {[type]} eventUser [description]
   */
  async saveUserRewards(event, eventUser, options = {}) {
    const { hostUser } = event;
    await UserRewardsRepo.saveOrUpdate(
      {
        type: ''
      },
      options
    );
  }

  async updateTagsAndEndorsements() {
    const userEndorsements = await UserEndorsementsRepo.updateAllEndorsementGroupByUser('');
    await UserTagsRepo.updateAllTagsGroupByUser('');
    return userEndorsements;
  }
}

export default new UserService();
