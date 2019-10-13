import config from '../config';
import { randomSerialNumber } from '../utils/stringUtil';
import NotificationRepository from '../repositories/notifications.repository';
const axios = require('axios');
import logger from '../utils/logger';
import { date2String } from '../utils/dateUtil';
import { queryStringToJSON, replacePlacehoder } from '../utils/stringUtil';

const { spCode, loginName, password } = config.sms;
class MessageService {
  async sendMessage(message: string, recipients: string[], serialNumber: string) {
    const numbers = recipients.join(',');
    // numbers = '13651976276';
    const encodedMessage = encodeURIComponent(message);
    try {
      const {
        sms: { enabled: smsEnabled }
      } = config;
      const url = `http://47.104.243.247:8513/sms/Api/Send.do?SpCode=${spCode}&LoginName=${loginName}&Password=${password}&SerialNumber=${serialNumber}&MessageContent=${encodedMessage}&UserNumber=${numbers}`;
      logger.info(`Sending sms to ${url}`);
      if (smsEnabled) {
        const response = await axios.get(url);
        // console.log(response);
        const { data } = response;
        logger.info(`Response, ${data}`);
        return queryStringToJSON(data);
      } else {
        logger.info('SMS sendout is disabled');
        return { code: 100, description: 'sms disable' };
      }
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  /**
   * [saveCompleteEventNotifications description]
   * @param {[type]} event   [description]
   * @param {[type]} options [description]
   */
  async saveCompleteEventNotifications(event, options) {
    const notifications = [];
    notifications.push(this.createNotifications(event, 'event_completed', 'shop'));
    const response = await NotificationRepository.saveNotifications(notifications, options);

    await this.sendNewEventMessages(notifications, options);
    return response;
  }

  /**
   * Generate new event notification.
   *
   * @param {[type]} event   [description]
   * @param {[type]} options [description]
   */
  async saveNewEventNotifications(event, options) {
    const notifications = [];
    notifications.push(this.createNotifications(event, 'event_created', 'shop'));
    notifications.push(this.createNotifications(event, 'event_created', 'host'));
    const response = await NotificationRepository.saveNotifications(notifications, options);

    await this.sendNewEventMessages(notifications, options);
    return response;
  }

  async sendNewEventMessages(notifications, options) {
    for (let i = 0; i < notifications.length; i++) {
      const { message, recipients, serialNumber } = notifications[i];
      const response = await this.sendMessage(message, recipients, serialNumber);
      const notificationToUpdate = Object.assign(notifications[i], response);
      await NotificationRepository.updateNotificationStatus(notificationToUpdate, options);
    }
  }

  createNotifications(event, eventType: string, audience: string) {
    const notifications = [];
    const {
      sms: { templates }
    } = config;
    let shopMessageTemplate = undefined;
    switch (eventType) {
      case 'event_created':
        const { event_created } = templates;
        shopMessageTemplate = event_created[audience];
        break;
      case 'event_completed':
        const { event_completed } = templates;
        shopMessageTemplate = event_completed[audience];
        break;
      case 'event_joined':
        const { event_joined } = templates;
        shopMessageTemplate = event_joined[audience];
        break;
    }
    // const eventType = 'event_created';
    // const audience = 'shop';
    if (shopMessageTemplate) {
      throw new Error(`Cannot find message template by eventType ${eventType}, audience ${audience}`);
    }
    const {
      id: objectId,
      shop: { mobile }
    } = event;
    const status = 'created';
    return {
      serialNumber: randomSerialNumber(),
      eventType,
      audience,
      objectId,
      message: this.updateMessageTemplate(shopMessageTemplate, config.sms.placeholders, { event }),
      recipients: [mobile]
    };
  }

  // 【不咕咕】拼团成功！<shopName>，《<scriptName>》[<startTime>]拼团成功，请锁场！感谢<hostName>（微信号）的辛勤组团，根据不咕咕返现规则，您需要依次返现给①<hostName>（微信号）xxx元；②[参加者]（微信号）xx元；③[参加者]（微信号）xx元；④[参加者]（微信号）xx元；⑤[参加者]（微信号）xx元… 若有疑问，请联系不咕咕官方微信。
  updateMessageTemplate(messageTemplate: string, placeholders: string[], replacements) {
    let message = messageTemplate;
    try {
      for (let i = 0; i < placeholders.length; i++) {
        const placeholder = placeholders[i];
        const {
          shop: { name: shopName, wechatId: shopWechatId },
          hostUser: { nickName },
          hostUserWechatId,
          script: { name: scriptName },
          startTime
        } = replacements.event;
        switch (placeholder) {
          case 'shopWechatId':
            message = replacePlacehoder(message, placeholder, shopWechatId);
            break;
          case 'shopName':
            message = replacePlacehoder(message, placeholder, shopName);
            break;
          case 'hostName':
            message = replacePlacehoder(message, placeholder, nickName);
            break;
          case 'hostWechatId':
            message = replacePlacehoder(message, placeholder, hostUserWechatId);
            break;
          case 'scriptName':
            message = replacePlacehoder(message, placeholder, scriptName);
            break;
          case 'startTime':
            message = replacePlacehoder(message, placeholder, date2String(startTime));
            break;
        }
      }
    } catch (err) {
      logger.error(`Error generating message from template ${messageTemplate}`);
    } finally {
      return message;
    }
  }
}

export default new MessageService();
