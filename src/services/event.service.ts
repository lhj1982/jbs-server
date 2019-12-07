import config from '../config';
const axios = require('axios');
const fs = require('fs');
import logger from '../utils/logger';
import FileService from './file.service';
import OrderService from './order.service';
import { nowDate } from '../utils/dateUtil';
import { pp, getRandomString } from '../utils/stringUtil';
import OrdersRepo from '../repositories/orders.repository';
import RefundsRepo from '../repositories/refunds.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import { ResourceNotFoundException } from '../exceptions/custom.exceptions';

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
          const uploadResp = {
            hash: '',
            key: `static/images/events/qrcode/${eventId}.png`
          };
          return uploadResp;
        }
        logger.error(err);
        throw err;
      }
      // }
    }
  }

  async getwxcode(accessToken: string, eventId: string) {
    //方法2： 利用request模块发起请求
    const postData = {
      page: 'pages/event_detail', //二维码默认打开小程序页面
      scene: eventId,
      width: 100,
      auto_color: false
    };
    // postData = JSON.stringify(postData);
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

  /**
   * Rules for cancel bookings, for both cancelled event and event which its price has updated
   *
   * 1. find all paid eventUsers for given event
   * 2. Mark them as unpaid + statusNote
   * 3. Mark all paid orders for those bookings to refund_requested
   *
   * @param {[type]} event   [description]
   * @param {{}}   options [description]
   */
  async cancelBookings(event, statusNote: string, refundDesc: string, immediateRefund = false, options: {}) {
    const { id } = event;
    const eventUsers = await EventUsersRepo.findByEvent(id, {
      status: ['paid']
    });
    // console.log(eventUsers);
    // find all paid orders and mark them as refund
    const refundedOrders = [];
    for (let i = 0; i < eventUsers.length; i++) {
      const eventUser = eventUsers[i];
      // const {
      //   user: { id: createdBy },
      //   id: objectId
      // } = eventUser;
      // const params = {
      //   createdBy,
      //   type: 'event_join',
      //   objectId,
      //   orderStatus: 'paid'
      // };
      // // console.log(params);
      // const order = await OrdersRepo.findByParams(params);
      // // console.log(orders);
      // if (order) {
      //   const { amount, outTradeNo, _id } = order;
      //   // console.log('ssss');
      //   await OrdersRepo.updateStatus(params, { orderStatus: 'refund' }, options);
      //   await RefundsRepo.saveOrUpdate(
      //     {
      //       order: _id,
      //       user: createdBy,
      //       totalAmount: amount,
      //       refundAmount: amount,
      //       outTradeNo,
      //       outRefundNo: getRandomString(32),
      //       refundDesc: 'refund - cancelled event',
      //       type: 'refund',
      //       status: 'created',
      //       createdAt: nowDate()
      //     },
      //     options
      //   );
      //   await this.markEventUsersUnpaid(eventUser, statusNote, options);
      //   refundedOrders.push(order);
      // }
      try {
        const order = await this.cancelBooking(eventUser, refundDesc, immediateRefund, options);
        await this.markEventUsersUnpaid(eventUser, statusNote, options);
        if (order) {
          refundedOrders.push(order);
        }
      } catch (err) {
        logger.error(err);
      }
    }
    logger.info(`Found orders to be refunded, ${pp(refundedOrders)}`);
    return refundedOrders;
  }

  async cancelBooking(eventUser: any, refundDesc: string, immediateRefund = false, options: any) {
    const {
      user: { id: createdBy },
      id: objectId
    } = eventUser;
    const params = {
      createdBy,
      type: 'event_join',
      objectId,
      orderStatus: 'paid'
    };
    // console.log(params);
    // console.log(params);
    const order = await OrdersRepo.findByParams(params);
    // console.log(orders);
    if (order) {
      const { amount, outTradeNo, _id } = order;
      // console.log('ssss');
      await OrdersRepo.updateStatus(params, { orderStatus: 'refund' }, options);
      await RefundsRepo.saveOrUpdate(
        {
          order: _id,
          user: createdBy,
          totalAmount: amount,
          refundAmount: amount,
          outTradeNo,
          outRefundNo: getRandomString(32),
          refundDesc,
          type: 'refund',
          status: immediateRefund ? 'approved' : 'created',
          createdAt: nowDate()
        },
        options
      );
      return order;
    } else {
      logger.warn(`No paid order is found, ${pp(params)}, no need to process`);
      return undefined;
    }
  }

  async markEventUsersUnpaid(eventUser, statusNote, options) {
    const eventUserToUpdate = Object.assign(eventUser.toObject(), {
      status: 'unpaid',
      statusNote
    });
    return await EventUsersRepo.update(eventUserToUpdate, options);
  }

  isPaymentSupported(shop: any): boolean {
    const { supportedPaymentMethods } = shop;
    if (supportedPaymentMethods && supportedPaymentMethods.length > 0 && supportedPaymentMethods.indexOf('wechat') != -1) {
      return true;
    }
    return false;
  }
}

export default new EventService();
