import config from '../config';
import { randomSerialNumber } from '../utils/stringUtil';
import NotificationRepository from '../repositories/notifications.repository';
const axios = require('axios');
import logger from '../utils/logger';
import { queryStringToJSON, replacePlacehoder } from '../utils/stringUtil';

const { spCode, loginName, password } = config.sms;
class MessageService {
  async sendMessage(message: string, recipients: string[], serialNumber: string) {
    const numbers = recipients.join(',');
    const encodedMessage = encodeURIComponent(message);
    try {
      const {
        sms: { enabled: smsEnabled }
      } = config;
      const url = `http://47.104.243.247:8513/sms/Api/Send.do?SpCode=${spCode}&LoginName=${loginName}&Password=${password}&SerialNumber=${serialNumber}&MessageContent=${encodedMessage}&UserNumber=${numbers}`;
      logger.info(`Sending sms to ${url}`);
      if (smsEnabled) {
        const response = await axios.get(url);
        const { data } = response.data;
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
      sms: {
        templates: { event_created }
      }
    } = config;
    const shopMessageTemplate = event_created[audience];
    // const eventType = 'event_created';
    // const audience = 'shop';

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

  updateMessageTemplate(messageTemplate: string, placeholders: string[], replacements) {
    let message = messageTemplate;
    try {
      for (let i = 0; i < placeholders.length; i++) {
        const placeholder = placeholders[i];
        const {
          shop: { shopName },
          hostUser: { nickName },
          hostUserWechatId,
          script: { name: scriptName },
          startTime
        } = replacements.event;
        switch (placeholder) {
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
            message = replacePlacehoder(message, placeholder, startTime);
            break;
        }
      }
    } catch (err) {
      logger.error(`Error generating message from template ${messageTemplate}`);
    }
  }
}

export default new MessageService();
