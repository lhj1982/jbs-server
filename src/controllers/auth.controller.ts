import { Request, Response } from 'express';
import AuthApi from '../api/auth';
import UsersRepo from '../repositories/users.repository';
import RolesRepo from '../repositories/roles.repository';
import * as moment from 'moment';
import * as jwt from 'jsonwebtoken';
import config from '../config';

export class AuthController {
  login = async (req: Request, res: Response) => {
    const params = req.body;
    // prettier-ignore
    const { type, nickName, avatarUrl, gender, country, province, city, language } = params;
    try {
      if (type === 'wxapp') {
        const response = await AuthApi.code2Session(params.code);
        // prettier-ignore
        // const response = { code: 'SUCCESS', openId: '1234', sessionKey: 'test1', unionId: undefined, errorCode: undefined, errorMsg: undefined };
        const { code, openId, unionId, sessionKey, errorCode, errorMsg } = response;
        // console.log(response);
        if (code === 'SUCCESS') {
          // const user = await AuthApi.getUserInfo(sessionKey);
          // prettier-ignore
          const role = await RolesRepo.findByName('user');
          const roles = [role._id];
          const role1 = await RolesRepo.findByName('admin');
          if (openId === 'opcf_0En_ukxF-NVT67ceAyFWfJw') {
            roles.push(role1._id);
          }
          const user = await UsersRepo.saveOrUpdateUser({
            openId,
            unionId,
            sessionKey,
            nickName,
            gender,
            country,
            province,
            city,
            language,
            status: 'active',
            roles
          });
          // create a token string
          // console.log(this.getTokenPayload);
          // console.log(user._id);
          const token = jwt.sign(this.getTokenPayload(user), config.jwt.secret);
          // console.log(token);
          res.json({ openId, token, user });
        } else {
          throw new Error(`Cannot get sessionKey, errorCode: ${errorCode}`);
        }
      } else {
        throw new Error(`Unknown login type, ${type}`);
      }
      // const contact = await UsersRepo.find({});
    } catch (err) {
      res.send(err);
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
    const data = {
      type: 'wxapp',
      openId: user.openId
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
