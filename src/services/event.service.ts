import config from '../config';
const axios = require('axios');
const fs = require('fs');
import logger from '../utils/logger';
import FileService from './file.service';

class EventService {
  async getQrCode(eventId: string) {
    const time2 = 0,
      accessToken = '';
    const time1 = new Date().getTime();
    if (!time2 && time1 - time2 > 7000) {
      try {
        const response = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`);
        const {
          data: { access_token: accessToken }
        } = response;
        // var data = JSON.parse(body);
        // access_token = data.access_token;
        const imageData = await this.getwxcode(accessToken, eventId);
        const uploadResp = await FileService.uploadFile(`static/events/qrcode/${eventId}.png`, imageData);
        return uploadResp;
      } catch (err) {
        logger.error(err);
        throw err;
      }
    } else {
      return await this.getwxcode(accessToken, eventId);
    }
  }

  async getwxcode(accessToken: string, eventId: string) {
    //方法2： 利用request模块发起请求
    const postData = {
      page: 'pages/event_detail', //二维码默认打开小程序页面
      // scene: "5dafcd0853aa5e56395ff465",//打开页面时携带的参数
      scene: eventId,
      width: 100,
      auto_color: false
    };
    console.log(accessToken);
    console.log(JSON.stringify(postData));
    // postData = JSON.stringify(postData);
    const response = await axios.post(`https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`, JSON.stringify(postData));
    // console.log(response);
    const { data } = response;
    return data;
  }
}

export default new EventService();
