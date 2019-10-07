import * as moment from 'moment';
import config from '../config';
const axios = require('axios');

// const appId = 'wx67080218c81daab6';
// const appSecret = 'f714576304cbae30e6976ecc82beb84a';
class AuthApi {
  // GET https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
  code2Session = async (code: string) => {
    try {
      const response = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${config.appId}&secret=${config.appSecret}&js_code=${code}&grant_type=authorization_code`);
      const { session_key, openid, unionid, errcode, errmsg } = response.data;
      if (errcode && errcode !== 0) {
        return { code: 'FAIL', errorCode: errcode, errorMsg: errmsg };
      } else {
        return {
          code: 'SUCCESS',
          sessionKey: session_key,
          openId: openid,
          unionId: unionid
        };
      }
    } catch (error) {
      console.error(error);
    }
  };

  // GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
  getAccessToken = async () => {
    try {
      const response = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`);
      const { access_token, expires_in, errcode, errmsg } = response.data;
      // console.log(access_token);
      if (errcode && errcode !== 0) {
        return { code: 'FAIL', errorCode: errcode, errorMsg: errmsg };
      } else {
        const expiredAt = moment().add(expires_in, 's');
        return {
          code: 'SUCCESS',
          accessToken: access_token,
          expiredAt,
          createdAt: new Date()
        };
      }
    } catch (error) {
      console.error(error);
    }
  };
}

export default new AuthApi();
