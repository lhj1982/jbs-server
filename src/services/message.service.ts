import config from '../config';
import { randomSerialNumber } from '../utils/stringUtil';
import UsersRepository from '../repositories/users.repository';
import NotificationRepository from '../repositories/notifications.repository';
const axios = require('axios');
import logger from '../utils/logger';
import { date2String } from '../utils/dateUtil';
import { queryStringToJSON, replacePlacehoder, isMobileNumber } from '../utils/stringUtil';

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
        // console.log(response);
        const { data } = response;
        logger.info(`Response, ${data}`);
        return queryStringToJSON(data);
      } else {
        logger.info('SMS sendout is disabled');
        return { code: 100, description: 'sms disable' };
      }
    } catch (err) {
      logger.error(`Error when sending join messages, err: ${err.toString()}, stack: ${err.stack}`);
      throw err;
    }
  }

  /**
   * Save notifications when a user joins an event.
   *
   * @param {[type]} eventUser [description]
   * @param {[type]} options   [description]
   */
  async saveNewJoinEventNotifications(event, eventUser, options) {
    const notifications = [];
    try {
      notifications.push(await this.createNotifications({ event, eventUser }, 'event_joined', 'shop'));
      // console.log(notifications);
      const response = await NotificationRepository.saveNotifications(notifications, options);

      await this.sendNewEventMessages(notifications, options);
      return response;
    } catch (err) {
      logger.error(`Error when sending join messages, err: ${err.toString()}, stack: ${err.stack}`);
      throw err;
    }
  }

  /**
   * [saveCompleteEventNotifications description]
   * @param {[type]} event              [description]
   * @param {[type]} eventCommissions   [description]
   * @param {[type]} options            [description]
   */
  async saveCompleteEventNotifications(event, eventCommissions, options) {
    const notifications = [];
    try {
      notifications.push(await this.createNotifications({ event, eventCommissions }, 'event_completed', 'shop'));
      // console.log(notifications);
      const response = await NotificationRepository.saveNotifications(notifications, options);

      await this.sendNewEventMessages(notifications, options);
      return response;
    } catch (err) {
      logger.error(`Error when sending join messages, err: ${err.toString()}, stack: ${err.stack}`);
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
    try {
      notifications.push(await this.createNotifications({ event }, 'event_created', 'shop'));
      notifications.push(await this.createNotifications({ event }, 'event_created', 'host'));
      const response = await NotificationRepository.saveNotifications(notifications, options);

      await this.sendNewEventMessages(notifications, options);
      return response;
    } catch (err) {
      logger.error(`Error when sending join messages, err: ${err.toString()}, stack: ${err.stack}`);
      throw err;
    }
  }

  async sendNewEventMessages(notifications, options) {
    for (let i = 0; i < notifications.length; i++) {
      const { smsMessage, recipients, serialNumber, audience, eventType } = notifications[i];
      if (audience !== 'shop' || (audience === 'shop' && eventType === 'event_created')) {
        const response = await this.sendMessage(smsMessage, recipients, serialNumber);
        const notificationToUpdate = Object.assign(notifications[i], response);
        await NotificationRepository.saveOrUpdate(notificationToUpdate, options);
      } else {
        logger.info(`No sms will be sent to ${audience} or not ${eventType}`);
      }
    }
  }

  async createNotifications(object: any, eventType: string, audience: string) {
    logger.info(`Create notification for eventType: ${eventType}, audience: ${audience}`);
    const { event, eventUser, eventCommissions } = object;
    const { id: eventId } = event;
    const notifications = [];
    const {
      notification: { templates, smsTemplates }
    } = config;
    let shopMessageTemplate = '';
    let smsMessageTemplate = '';
    let recipient = '18116469554';
    const serialNumber = randomSerialNumber();
    const url = replacePlacehoder(`${config.notification.url}`, 'eventId', eventId);
    // console.log(eventType);
    // console.log(templates);
    switch (eventType) {
      case 'event_created':
        const { event_created } = templates;
        const { event_created: smsEventCreated } = smsTemplates;
        shopMessageTemplate = event_created[audience];
        smsMessageTemplate = smsEventCreated[audience];
        // if (audience === 'shop') {
        //   const {
        //     shop: { mobile }
        //   } = event;
        //   recipient = mobile;
        // } else if (audience === 'host') {
        if (audience === 'host') {
          const { hostUserMobile } = event;
          recipient = hostUserMobile;
        }
        break;
      case 'event_completed':
        const { event_completed } = templates;
        const { event_completed: smsEventCompleted } = smsTemplates;
        shopMessageTemplate = event_completed[audience];
        smsMessageTemplate = smsEventCompleted[audience];
        const commissionText = await this.generateCommissionDetailContext(event, eventCommissions);
        logger.info(`commission text ${commissionText}`);
        shopMessageTemplate = this.updateMessageTemplate(shopMessageTemplate, ['commissionDetails'], { event, commissionDetails: commissionText });
        // if (audience === 'shop') {
        //   const {
        //     shop: { mobile }
        //   } = event;
        //   recipient = mobile;
        // } else if (audience === 'host') {
        //   const { hostUserMobile } = event;
        //   recipient = hostUserMobile;
        // }
        break;
      case 'event_joined':
        const { event_joined } = templates;
        const { event_joined: smsEventJoined } = smsTemplates;
        shopMessageTemplate = event_joined[audience];
        smsMessageTemplate = smsEventJoined[audience];
        // if (audience === 'shop') {
        //   const {
        //     shop: { mobile }
        //   } = event;
        //   recipient = mobile;
        // } else if (audience === 'participator') {
        //   const { mobile } = eventUser;
        //   recipient = mobile;
        // }
        break;
    }

    if (!recipient) {
      throw new Error(`Cannot find recipient by eventType ${eventType}, audience ${audience}, event ${event.id}`);
      return;
    }
    if (!isMobileNumber(recipient)) {
      throw new Error(`${recipient} is not a valid mobile number`);
      return;
    }
    // const eventType = 'event_created';
    // const audience = 'shop';
    if (!shopMessageTemplate) {
      logger.error(`Cannot find notification template by eventType ${eventType}, audience ${audience}, event ${event.id}`);
      return;
    }
    if (!smsMessageTemplate) {
      logger.error(`Cannot find sms template by eventType ${eventType}, audience ${audience}, event ${event.id}`);
      return;
    }
    try {
      const {
        id: objectId,
        shop: { mobile }
      } = event;
      let participatorWechatId,
        participatorName = '';
      if (eventUser) {
        const { wechatId, user: userId } = eventUser;
        const participator = await UsersRepository.findById(userId);
        const { nickName } = participator;
        participatorName = nickName;
        participatorWechatId = wechatId;
      }
      const status = 'created';
      return {
        serialNumber,
        eventType,
        audience,
        objectId,
        message: this.updateMessageTemplate(shopMessageTemplate, config.notification.placeholders, { event, participatorName, participatorWechatId }),
        smsMessage: this.updateMessageTemplate(smsMessageTemplate, config.notification.placeholders, { event, participatorName, participatorWechatId, url }),
        recipients: [recipient]
      };
    } catch (err) {
      throw err;
    }
  }

  async generateCommissionDetailContext(event, commission) {
    const { members } = event;
    if (!commission) {
      return '';
    }

    // const commission = commissions[0];

    const {
      commissions: {
        host: { user: hostUserId, amount: hostCommission },
        participators
      }
    } = commission;
    const hostUser = await UsersRepository.findById(hostUserId);
    const { hostName, hostWechatId } = hostUser;
    const hostMessageTemplate = '发起人 <hostName>（<hostWechatId>） <hostCommission>元';
    const hostMessage = this.updateMessageTemplate(hostMessageTemplate, ['hostName', 'hostWechatId', 'hostCommission'], { event, hostCommission });
    let participatorMessage = '';
    for (let i = 0; i < participators.length; i++) {
      const participator = participators[i];
      // console.log(participator);
      const {
        user: { _id: userId },
        amount: participatorCommission
      } = participator;
      const participatorUser = await UsersRepository.findById(userId);
      const { nickName } = participatorUser;
      const { wechatId } = this.getParticipatorUser(members, userId);
      const participatorMessageTemplate = `${i + 1}) <participatorName>（<participatorWechatId>） <participatorCommission>元 `;
      const participatorMessagePart = this.updateMessageTemplate(participatorMessageTemplate, ['participatorName', 'participatorWechatId', 'participatorCommission'], {
        event,
        participatorCommission,
        participatorName: nickName,
        participatorWechatId: wechatId
      });
      participatorMessage = participatorMessage + participatorMessagePart;
    }
    return hostMessage + ' ' + participatorMessage;
  }

  /**
   * Find member info by id.
   *
   * @param {[type]} eventUsers [description]
   * @param {string} userId     [description]
   */
  getParticipatorUser(eventUsers, userId: string) {
    for (let i = 0; i < eventUsers.length; i++) {
      const eventUser = eventUsers[i];
      const {
        user: { _id: eventUserId }
      } = eventUser;
      // console.log(typeof eventUserId + ', ' + eventUserId);
      // console.log(typeof userId + ', ' + userId);
      if (eventUserId.toString() == userId.toString()) {
        return eventUser;
      }
    }
    return undefined;
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
        const { hostCommission, participatorName, participatorWechatId, participatorCommission, commissionDetails, url } = replacements;
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
          case 'hostCommission':
            message = replacePlacehoder(message, placeholder, hostCommission);
            break;
          case 'commissionDetails':
            message = replacePlacehoder(message, placeholder, commissionDetails);
            break;
          case 'participatorName':
            message = replacePlacehoder(message, placeholder, participatorName);
            break;
          case 'participatorWechatId':
            message = replacePlacehoder(message, placeholder, participatorWechatId);
            break;
          case 'participatorCommission':
            message = replacePlacehoder(message, placeholder, participatorCommission);
            break;
          case 'url':
            message = replacePlacehoder(message, placeholder, url);
            break;
        }
      }
    } catch (err) {
      logger.error(`Error generating message from template ${messageTemplate}, ${err.stack}`);
    } finally {
      return message;
    }
  }
}

export default new MessageService();
