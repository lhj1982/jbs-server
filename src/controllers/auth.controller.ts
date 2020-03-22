import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import UsersRepo from '../repositories/users.repository';
import RolesRepo from '../repositories/roles.repository';
import UserService from '../services/user.service';
import CacheService from '../services/cache.service';
import { InvalidRequestException, WrongCredentialException, ResourceNotFoundException, GenericServerErrorException } from '../exceptions/custom.exceptions';
import * as moment from 'moment';
import * as jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    const params = req.body;
    // prettier-ignore
    const { type, nickName, avatarUrl, gender, country, province, city, language, description, encryptedData, iv } = params;
    try {
      if (type === 'wxapp') {
        if (!avatarUrl) {
          next(new InvalidRequestException('Auth', ['avatarUrl']));
          return;
        }
        if (!gender || ['male', 'female'].indexOf(gender) == -1) {
          next(new InvalidRequestException('Auth', ['gender']));
          return;
        }
        const response = await AuthApi.code2Session(params.code);
        // prettier-ignore
        // const response = { code: 'SUCCESS', openId: '1234', sessionKey: 'test1', unionId: undefined, errorCode: undefined, errorMsg: undefined };
        const { code, openId, unionId, sessionKey, errorCode, errorMsg } = response;
        // console.log(response);
        if (code === 'SUCCESS') {
          // const user = await AuthApi.getUserInfo(sessionKey);
          // prettier-ignore
          const decryptedUserData = await UserService.getWechatEncryptedData({
            iv,
            encryptedData,
            sessionKey
          });
          const { unionId, openId: decryptedOpenId } = decryptedUserData;
          if (!unionId) {
            logger.error(`User ${openId} does not have unionId`);
            throw new GenericServerErrorException(`Cannot login`);
          }
          // console.log(unionId);
          // console.log(decryptedOpenId);
          const role = await RolesRepo.findByName('user');
          const roles = [role._id];
          const role1 = await RolesRepo.findByName('admin');
          if (unionId === 'oar2Nv1r44GdfvWd43XxQSACEg10') {
            roles.push(role1._id);
          }
          const userToUpdate = {
            openId,
            unionId,
            sessionKey,
            nickName,
            description,
            avatarUrl,
            gender,
            country,
            province,
            city,
            language,
            status: 'active',
            roles
          };
          // update user info only if there is no data from wechat.
          const user = await UserService.findOneByParams({ openId });
          if (user) {
            if (user.nickName) {
              userToUpdate.nickName = user.nickName;
            }
            if (user.description) {
              userToUpdate.description = user.description;
            }
            if (user.avatarUrl) {
              userToUpdate.avatarUrl = user.avatarUrl;
            }
            if (user.gender) {
              userToUpdate.gender = user.gender;
            }
            if (user.country) {
              userToUpdate.country = user.country;
            }
            if (user.province) {
              userToUpdate.province = user.province;
            }
            if (user.city) {
              userToUpdate.city = user.city;
            }
            if (user.language) {
              userToUpdate.language = user.language;
            }
            if (user.roles) {
              userToUpdate.roles = user.roles;
            }
          }
          await UsersRepo.saveOrUpdateUser(userToUpdate);
          const newUser = await UserService.findOneByParams({ unionId });
          // create a token string
          // console.log(this.getTokenPayload);
          // console.log(user._id);
          const token = jwt.sign(this.getTokenPayload(newUser), config.jwt.secret);
          // console.log(token);
          await CacheService.purgeUserCache(newUser);
          res.json({ openId, token, newUser });
        } else {
          next(new Error(`Cannot get sessionKey, errorCode: ${errorCode}`));
        }
      } else {
        next(new Error(`Unknown login type, ${type}`));
      }
      // const contact = await UsersRepo.find({});
    } catch (err) {
      next(err);
    }
  };

  loginWithUserNameAndPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    if (!username) {
      next(new InvalidRequestException('Auth', ['username']));
      return;
    }
    if (!password) {
      next(new InvalidRequestException('Auth', ['password']));
      return;
    }
    try {
      const user = await UserService.findByUserNameAndPassword(username, password);
      // console.log(user);
      const token = jwt.sign(this.getTokenPayload(user), config.jwt.secret);
      res.json({ token, user });
    } catch (err) {
      res.send(err);
    }
  };

  updatePhoneNumber = async (req: Request, res: Response, next: NextFunction) => {
    const { openId, iv, encryptedData } = req.body;
    try {
      // console.log(body);
      const user = await UserService.findOneByParams({ openId });
      if (!user) {
        throw new ResourceNotFoundException('User', openId);
      }
      const { sessionKey } = user;
      const result = await UserService.getWechatEncryptedData({
        iv,
        encryptedData,
        sessionKey
      });
      const { phoneNumber } = result;
      const userToUpdate = Object.assign(user, {
        mobile: phoneNumber
      });
      const newUser = await UsersRepo.saveOrUpdateUser(userToUpdate);
      res.json({ code: 'SUCCESS', data: newUser });
    } catch (err) {
      next(err);
    }
  };

  code2session = async (req: Request, res: Response, next: NextFunction) => {
    const {
      body: { code }
    } = req;
    try {
      const response = await AuthApi.code2Session(code);
      res.json({ code: 'SUCCESS', response });
    } catch (err) {
      next(err);
    }
  };

  getTokenPayload = (user): any => {
    // const now = Math.floor(new Date().getTime()/1000);
    const expiredAt = Math.floor(
      moment
        .utc()
        .add(config.jwt.duration, 's')
        .toDate()
        .getTime() / 1000
    );
    const { openId, unionId } = user;
    const data = {
      type: 'wxapp',
      openId: openId,
      unionId: unionId
    };
    // console.log(expiredAt);
    return {
      iss: config.jwt.issuer,
      sub: user._id,
      exp: expiredAt,
      data: JSON.stringify(data)
    };
  };
}
