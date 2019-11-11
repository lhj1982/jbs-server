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
        const imageData = await this.getwxcode(accessToken, eventId);

        const base64Str = Buffer.from(imageData, 'binary').toString('base64');
        const uploadResp = await FileService.uploadFileBase64(`static/images/events/qrcode/${eventId}.png`, base64Str);
        return uploadResp;
      } catch (err) {
        if (err.error == 'file exists') {
          const uploadResp ={
            "hash": "",
            "key": `static/images/events/qrcode/${eventId}.png`
          }
          return uploadResp;
        }
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
      scene: eventId, //打开页面时携带的参数
      width: 100,
      auto_color: false
    };
    const response = await axios({
      responseType: 'arraybuffer',
      method: 'POST',
      url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'image/png'
      },
      data: JSON.stringify(postData)
    });
    const { data } = response;
    return data;
  }
}

export default new EventService();
