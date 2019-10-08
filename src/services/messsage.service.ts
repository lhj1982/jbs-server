import config from '../config';
import { randomSerialNumber } from '../utils/stringUtil';
const axios = require('axios');

const { spCode, loginName, password } = config.sms;
class MessageService {
  async sendMessage(message: string, recipients: string[]) {
    const numbers = recipients.join(',');
    const encodedMessage = encodeURIComponent(message);
    try {
      const response = await axios.get(
        `http://47.104.243.247:8513/sms/Api/Send.do?SpCode=${spCode}&LoginName=${loginName}&Password=${password}&SerialNumber=${randomSerialNumber()}&MessageContent=${encodedMessage}&UserNumber=${numbers}`
      );
    } catch (err) {}
  }
}

export default new MessageService();
