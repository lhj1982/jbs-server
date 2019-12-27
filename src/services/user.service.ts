import config from '../config';
import logger from '../utils/logger';
import { pp } from '../utils/stringUtil';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import UserTagsRepo from '../repositories/userTags.repository';
import UserEndorsementsRepo from '../repositories/userEndorsements.repository';
import UserPointsRepo from '../repositories/userPoints.repository';
const WXBizDataCrypt = require('../utils/WXBizDataCrypt');

class UserService {
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
      const tags = await this.getEventUserTags(newUserTag);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        tags
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
      const numberOfEndorsements = await this.getNumberOfEndorsements(endorsement);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        numberOfEndorsements
      });
      // console.log(eventUserToUpdate);
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
    const userTags = await UserTagsRepo.getByUser({ user, type, objectId });
    return userTags;
  }

  async getNumberOfEndorsements(endorsement: any) {
    const { type, endorsedBy, user, objectId } = endorsement;
    const endorsements = await UserEndorsementsRepo.getEndorsements({
      type,
      objectId,
      user
    });
    const numberOfEndorsements = endorsements.length;
    return numberOfEndorsements;
  }

  /**
   * Save user points.
   *
   * @param {[type]} event     [description]
   * @param {[type]} eventUser [description]
   */
  async saveUserPoints(event, eventUser, options = {}) {
    const { hostUser } = event;
    await UserPointsRepo.saveOrUpdate(
      {
        type: ''
      },
      options
    );
  }

  async updateTagsAndEndorsements() {
    const userEndorsements = await EventUsersRepo.updateAllEndorsementGroupByUser('');
    await EventUsersRepo.updateAllTagsGroupByUser('');
    return userEndorsements;
  }
}

export default new UserService();
