import config from '../config';
import logger from '../utils/logger';
import UsersRepo from '../repositories/users.repository';
import { decryptData } from '../utils/WXBizDataCrypt';
// const WXBizDataCrypt = require('../utils/WXBizDataCrypt');

// var appId = 'wx4f4bc4dec97d474b'
// var sessionKey = 'tiihtNczf5v6AKRyjwEUhQ=='
// var encryptedData =
// 	'CiyLU1Aw2KjvrjMdj8YKliAjtP4gsMZM'+
// 	'QmRzooG2xrDcvSnxIMXFufNstNGTyaGS'+
// 	'9uT5geRa0W4oTOb1WT7fJlAC+oNPdbB+'+
// 	'3hVbJSRgv+4lGOETKUQz6OYStslQ142d'+
// 	'NCuabNPGBzlooOmB231qMM85d2/fV6Ch'+
// 	'evvXvQP8Hkue1poOFtnEtpyxVLW1zAo6'+
// 	'/1Xx1COxFvrc2d7UL/lmHInNlxuacJXw'+
// 	'u0fjpXfz/YqYzBIBzD6WUfTIF9GRHpOn'+
// 	'/Hz7saL8xz+W//FRAUid1OksQaQx4CMs'+
// 	'8LOddcQhULW4ucetDf96JcR3g0gfRK4P'+
// 	'C7E/r7Z6xNrXd2UIeorGj5Ef7b1pJAYB'+
// 	'6Y5anaHqZ9J6nKEBvB4DnNLIVWSgARns'+
// 	'/8wR2SiRS7MNACwTyrGvt9ts8p12PKFd'+
// 	'lqYTopNHR1Vf7XjfhQlVsAJdNiKdYmYV'+
// 	'oKlaRv85IfVunYzO0IKXsyl7JCUjCpoG'+
// 	'20f0a04COwfneQAGGwd5oa+T8yO5hzuy'+
// 	'Db/XcxxmK01EpqOyuxINew=='
// var iv = 'r7BXXKkLb8qrSNn05n0qiA=='

// var pc = new WXBizDataCrypt(appId, sessionKey)

// var data = pc.decryptData(encryptedData , iv)

// console.log('解密后 data: ', data)
//
class UserService {
  /**
   * 1. check user session key
   * 2. if it's expired, request a new one.
   * 3. use the session key to get encrypted data decrypted
   *
   * @param {[type]} user [description]
   * @param {[type]} data [description]
   */
  async getWechatEncryptedData(user, data) {
    const session = await UsersRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { sessionKey } = user;
      const { encryptedData, iv } = data;
      const { appId } = config;

      const decryptedData = decryptData(
        'nSGBDXip2Eqa4JVtLOhI30o/Vd/ra+seyfaRXnSq1+LVKQoVGIw3G1dqBJsQ3ZexPui6ClTAjZcCZzujOXGJjAFEzkb1bu+w47vxdZhKnrVZOTEnTfc76qX7v/QkzOT/JZBsGyWgkg/BgUYMIXhOS4EDr9cP1YGYZwlHp6XLP9+6MtD7sAw6JzpvNCJvXmPzZovjmJBZe4FZDimdDGX4+YiD6y++xBGCTd7/RpX4WS5a2BNkoKlwKwgyAEfCZJ5mWdXhCIBIC3rD5Ky53F1e8OYtNf9jw9wg87bSfl/oeSIOhN1mPpPjGaQTdnc2mrZY8sUnP6OfI66ug95lrfkqwqYZfOCYmM7YN4kTgpr3uLubTCFqmb/dzr53OoJO7uocUB1wdwRjWwbqnlP5W+zgftVMc5Y/hGri8kekexl2CDYdNm3yCzyjqwZT9J0RiFvY1ByLZuM1XTHurNiUll+DJA==',
        'q43ucennCcjyIkw1JvYGAw==',
        '1N737A9ZQjxMSqLPDjwvDQ=='
      );
      console.log(appId);
      console.log(decryptedData);
      return decryptedData;
      await session.commitTransaction();
      await UsersRepo.endSession();
    } catch (err) {
      console.error(err);
      await session.abortTransaction();
      await UsersRepo.endSession();
    }
  }
}

export default new UserService();
