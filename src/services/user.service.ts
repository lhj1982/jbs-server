import config from '../config';
import logger from '../utils/logger';
import { pp } from '../utils/stringUtil';
import UsersRepo from '../repositories/users.repository';
import UserTagsRepo from '../repositories/userTags.repository';
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

  async addUserTag(tag, eventUser) {
    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };

      const userTag = await UserTagsRepo.saveOrUpdate(tag, opts);
      await session.commitTransaction();
      await UsersRepo.endSession();
      return userTag;
    } catch (err) {
      await session.abortTransaction();
      await UsersRepo.endSession();
      throw err;
    }
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
}

export default new UserService();
