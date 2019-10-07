import config from '../config';
const axios = require('axios');

class MessageService {
  async sendMessage(message: string, recipients: string[]) {
    try {
      const response = await axios.get(`http://47.104.243.247:8513/sms/Api/Send.do?SpCode=`);
    } catch (err) {}
  }
}

export default new MessageService();
