import config from '../config';
import logger from '../utils/logger';
import UsersRepo from '../repositories/users.repository';
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
    const session = await UsersRepo.getSession();
    // session.startTransaction();
    try {
      const opts = { session };
      const { encryptedData, iv, sessionKey } = data;
      const { appId } = config;
      const newWBDC = new WXBizDataCrypt(appId, sessionKey);

      const resultPhone = newWBDC.decryptData(encryptedData, iv);
      const result = {
        phoneNumber: resultPhone.phoneNumber,
        countryCode: resultPhone.countryCode
      };
      return result;
      // await session.commitTransaction();
      // await UsersRepo.endSession();
    } catch (err) {
      // await session.abortTransaction();
      await UsersRepo.endSession();
    }
  }
}

export default new UserService();
