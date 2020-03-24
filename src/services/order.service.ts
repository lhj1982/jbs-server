import config from '../config';
const axios = require('axios');
import logger from '../utils/logger';
import { string2Date } from '../utils/dateUtil';
import { pp, getRandomString, normalizePaymentData, md5, decryption } from '../utils/stringUtil';
import { nowDate } from '../utils/dateUtil';
import OrdersRepo from '../repositories/orders.repository';
import RefundsRepo from '../repositories/refunds.repository';
import EventsRepo from '../repositories/events.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import { ResourceAlreadyExist, ResourceNotFoundException, InvalidPaymentSignatureException } from '../exceptions/custom.exceptions';
import * as _ from 'lodash';
const https = require('https');
const fs = require('fs');

const ip = require('ip');
const crypto = require('crypto');
const xml = require('xml2js');

class OrderService {
  async findByObjectId(objectId: string, status: string) {
    return await OrdersRepo.findByParams({
      objectId,
      orderStatus: status
    });
  }

  async searchOrders(params): Promise<any> {
    const { limit, offset, outTradeNo, shopName, fromDate, toDate } = params;
    const orders = await OrdersRepo.find({ outTradeNo, offset, limit });
    return orders;
  }

  async updateRefund(orderId, refundId, dataToUpdate) {
    const refund = await RefundsRepo.findById(refundId);
    if (!refund) {
      throw new ResourceNotFoundException('Refund', refundId);
    }
    const { status } = refund;
    if (status === 'created' || status === 'failed') {
      const refundToUpdate = Object.assign(refund.toObject(), dataToUpdate);
      // console.log(refundToUpdate);
      const newRefund = await RefundsRepo.saveOrUpdate(refundToUpdate);
      return newRefund;
    } else {
      logger.info(`Only can update created or failed refund`);
      return refund;
    }
  }

  /**
   * Create new order, throw exception if error is duplicated.
   *
   * @param {[type]} order   [description]
   * @param {[type]} options =             {} [description]
   */
  async createOrder(order, options = {}) {
    const { outTradeNo } = order;
    const existingOrder = await OrdersRepo.findByTradeNo(outTradeNo);
    if (existingOrder) {
      throw new ResourceAlreadyExist('Order', [outTradeNo]);
      return;
    }
    return await OrdersRepo.createOrder(order, options);
  }

  async wechatPay(order): Promise<any> {
    const appid = config.appId;

    const nonceStr = getRandomString(32);
    const {
      outTradeNo,
      createdBy: { openId },
      amount
    } = order;
    // console.log(order);
    const attach = '不咕咕 event cost';
    const body = '不咕咕 - 参团';
    const sign = this.getPrePaySign(appid, attach, body, openId, amount, config.mch.payNotifyUrl, ip.address(), nonceStr, outTradeNo);
    //通过参数和签名组装xml数据，用以调用统一下单接口
    const sendData = this.wxSendData(appid, attach, body, openId, amount, config.mch.payNotifyUrl, ip.address(), nonceStr, outTradeNo, sign);
    // console.log(sign, 'sign');
    const response = await axios({
      method: 'POST',
      url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
      data: sendData
    });
    const { data } = response;
    return new Promise((resolve, reject) => {
      xml
        .parseStringPromise(data.toString('utf-8'))
        .then(res => {
          const data = res.xml;
          logger.info(`unifiedorder status: ${pp(data)}`);
          // console.log(data);
          const normalizedData = normalizePaymentData(data);
          if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
            //获取预支付会话ID
            const normalizedData = normalizePaymentData(data);

            const { prepay_id: prepayId } = normalizedData;
            const payParams = this.getPayParams(appid, prepayId);
            // console.log(normalizedData);
            const payResult = this.getPaymentStatusOkResponse(normalizedData);
            resolve(Object.assign(payResult, payParams));
            // return { code: 'SUCCESS', data: payResult };
          } else {
            // return { code: 'FAIL', error: data };
            resolve(this.getPaymentErrorResponse(normalizedData));
          }
        })
        .catch(error => {
          // return { code: 'FAIL', error };
          reject(error);
        });
    });
  }

  /**
   * Example data
   *
   * {"appid":["wxf59749a45686779c"],"attach":["boogoogoo event cost"],"bank_type":["CFT"],"cash_fee":["100"],"fee_type":["CNY"],"is_subscribe":["N"],"mch_id":["1560901281"],"nonce_str":["u1AeoeNrAGZcJdJrMrFNwE27Wkmtdb0x"],"openid":["ofQG25BHVTfC37YEvwggI767QhF8"],"out_trade_no":["0iCn6xlrjVoyuVafVBrtYqKrbvkGdyXc"],"result_code":["SUCCESS"],"return_code":["SUCCESS"],"sign":["805B424371F65377CA7B1C3A686970BD"],"time_end":["20191121223812"],"total_fee":["100"],"trade_type":["JSAPI"],"transaction_id":["4200000466201911214822490787"]}
   *
   * @param  {[type]}       responseData [description]
   * @return {Promise<any>}              [description]
   */
  async confirmWechatPayment(responseData): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      const { xml: data } = responseData;
      logger.info(`payment notify status: ${pp(data)}`);
      const normalizedData = normalizePaymentData(data);
      // console.log(data);
      if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
        // //获取预支付会话ID
        // const prepayId = data.prepay_id[0];
        // const payResult = this.getPayParams(appid, prepayId);
        // console.log(normalizePaymentData(data));
        if (!this.isValidSign(normalizedData)) {
          // throw new InvalidPaymentSignatureException();
          reject(new InvalidPaymentSignatureException());
        } else {
          resolve(this.getPaymentStatusOkResponse(normalizedData));
        }
        // return { code: 'SUCCESS', data: payResult };
      } else {
        // return { code: 'FAIL', error: data };
        resolve(this.getPaymentErrorResponse(normalizedData));
      }
    });
  }

  async confirmWechatRefund(responseData): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // console.log(data);
      const { xml: data } = responseData;
      logger.info(`refund notify status: ${pp(data)}`);
      const normalizedData = normalizePaymentData(data);
      const { req_info } = normalizedData;
      try {
        const payload = await this.decryptRequestData(req_info);
        const { xml: decryptedData } = payload;
        logger.info(`refund notify decrypted status: ${pp(decryptedData)}`);
        const normalizedData = normalizePaymentData(decryptedData);
        normalizedData['return_code'] = data.return_code[0];
        if (data.return_msg) {
          normalizedData['return_msg'] = data.return_msg[0];
        }
        if (data.return_code[0] == 'SUCCESS') {
          const response = this.getRefundStatusOkResponse(normalizedData);
          resolve(response);
        } else {
          resolve(this.getRefundErrorResponse(normalizedData));
        }
      } catch (err) {
        reject(err);
      }
      // if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
      //   // //获取预支付会话ID
      //   // const prepayId = data.prepay_id[0];
      //   // const payResult = this.getPayParams(appid, prepayId);
      //   // console.log(normalizePaymentData(data));
      //   if (!this.isValidSign(normalizedData)) {
      //     // throw new InvalidPaymentSignatureException();
      //     reject(new InvalidPaymentSignatureException());
      //   } else {
      //     resolve(this.getPaymentStatusOkResponse(normalizedData));
      //   }
      //   // return { code: 'SUCCESS', data: payResult };
      // } else {
      //   // return { code: 'FAIL', error: data };
      //   resolve(this.getPaymentErrorResponse(normalizedData));
      // }
    });
  }

  async decryptRequestData(data): Promise<any> {
    const decodeDataBase64 = Buffer.from(data, 'base64');

    const encryptedKey = md5(config.mch.key).toLowerCase();
    const iv = Buffer.alloc(0); //设置偏移量
    let decxml = decryption(decodeDataBase64, encryptedKey, iv); //解码
    console.log(decxml);
    const reg = new RegExp('root>', 'g');
    decxml = decxml.replace(reg, 'xml>');
    return new Promise((resolve, reject) => {
      xml
        .parseStringPromise(decxml)
        .then(res => {
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * 
   * { return_code: [ 'SUCCESS' ],
  return_msg: [ 'OK' ],
  appid: [ 'wxf59749a45686779c' ],
  mch_id: [ '1560901281' ],
  device_info: [ '' ],
  nonce_str: [ 'BhGcNDnOWkp4PJd8' ],
  sign: [ '8CE3E1BEEF98C21CDE7191BBCFA7D3E4' ],
  result_code: [ 'SUCCESS' ],
  total_fee: [ '150' ],
  out_trade_no: [ 'iIGR6Bpik3S1ot9k14eVpj04qUNWWgPu' ],
  trade_state: [ 'NOTPAY' ],
  trade_state_desc: [ '订单未支付' ] }
   *
   * 
   * @param  {[type]}       order [description]
   * @return {Promise<any>}       [description]
   */
  async queryPaymentStatus(order): Promise<any> {
    const appid = config.appId;
    const nonceStr = getRandomString(32);
    const { outTradeNo } = order;
    // console.log(order);
    const sign = this.getQueryPaymentSign(appid, nonceStr, outTradeNo);
    const sendData = this.wxOrderQuerySendData(appid, nonceStr, outTradeNo, sign);
    const response = await axios({
      method: 'POST',
      url: 'https://api.mch.weixin.qq.com/pay/orderquery',
      data: sendData
    });
    const { data } = response;
    return new Promise((resolve, reject) => {
      xml
        .parseStringPromise(data.toString('utf-8'))
        .then(res => {
          const data = res.xml;
          logger.info(`orderquery status: ${pp(data)}`);
          // console.log(data);
          const normalizedData = normalizePaymentData(data);
          if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
            resolve(this.getPaymentStatusOkResponse(normalizedData));
          } else {
            resolve(this.getPaymentErrorResponse(normalizedData));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Update payment status when payment is succefully confirmed.
   * Update order status
   * Note: because pay notify will be sent multiple times, so we have to make sure we do not update eventUser status by mistake.
   * We ONLY update eventUser to paid when there is a 'created' order, if an order is paid or refund, we should not update eventUser again.
   * Update eventUser status if it's a event_join order type
   *
   * @param  {[type]}       order   [description]
   * @param  {[type]}       options =             {} [description]
   * @return {Promise<any>}         [description]
   */
  async updatePaymentStatus(order, options = {}): Promise<any> {
    const {
      payment: { outTradeNo }
    } = order;
    // const order = await OrdersRepo.findByTradeNo(outTradeNo);
    const { type, objectId } = order;
    const newOrder = await OrdersRepo.updatePaymentByTradeNo(order, options);
    if (type === 'event_join') {
      const eventUser = await EventUsersRepo.findById(objectId);
      const eventUserToUpdate = Object.assign(eventUser.toObject(), {
        status: 'paid'
      });
      // console.log(eventUserToUpdate);
      await EventUsersRepo.saveOrUpdate(eventUserToUpdate, options);
    }
    return newOrder;
  }

  /**
   * Get all orders which are marked as refund_requested and do refund.
   * Update orderStatus to refund afterwards and updated refunds array
   *
   * @return {Promise<any>} [description]
   */
  async refundOrders(options = {}): Promise<any> {
    const candidates = await RefundsRepo.getRefundableOrders({
      status: 'approved'
    });
    logger.info(`Found ${candidates.length} order(s) to refund, data: ${pp(candidates)}`);
    const promises = candidates.map(refund => {
      return new Promise((resolve, reject) => {
        try {
          resolve(this.refundOrder(refund, options));
        } catch (err) {
          reject(err);
        }
      });
    });
    // wait until all promises are resolved
    return await Promise.all(promises);
  }

  async refundOrder(refund, options = {}) {
    const { order } = refund;
    // console.log(order);
    const appid = config.appId;
    const nonceStr = getRandomString(32);
    const { outTradeNo, totalAmount: totalFee, refundAmount: refundFee, refundDesc, outRefundNo } = refund;
    const notifyUrl = config.mch.refundNotifyUrl;
    const sign = this.getRefundPaymentSign(appid, nonceStr, outTradeNo, outRefundNo, totalFee, refundFee, refundDesc, notifyUrl);
    const sendData = this.wxRefundSendData(appid, nonceStr, outTradeNo, outRefundNo, totalFee, refundFee, refundDesc, notifyUrl, sign);

    const agent = new https.Agent({
      rejectUnauthorized: false,
      cert: fs.readFileSync(config.mch.certFile),
      key: fs.readFileSync(config.mch.certKeyFile),
      passphrase: config.mch.mchId
    });

    const response = await axios({
      method: 'POST',
      url: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
      data: sendData,
      httpsAgent: agent
    });
    const { data } = response;
    return new Promise((resolve, reject) => {
      xml
        .parseStringPromise(data.toString('utf-8'))
        .then(async res => {
          const data = res.xml;
          logger.info(`refund status: ${pp(data)}`);
          // console.log(data);
          const normalizedData = normalizePaymentData(data);
          if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
            const orderToUpdate = Object.assign(order.toObject(), {
              orderStatus: 'refund'
            });
            await OrdersRepo.saveOrUpdate(orderToUpdate, options);

            const refundResp = this.getRefundStatusOkResponse(normalizedData);
            const refundToUpdate = Object.assign(refund.toObject(), {
              status: 'refund',
              ...refundResp
            });
            const newRefund = await RefundsRepo.saveOrUpdate(refundToUpdate, options);
            resolve(newRefund);
          } else {
            const refundResp = this.getRefundErrorResponse(normalizedData);
            const refundToUpdate = Object.assign(refund.toObject(), {
              status: 'failed',
              ...refundResp
            });
            // console.log(refundToUpdate);
            const newRefund = await RefundsRepo.saveOrUpdate(refundToUpdate, options);
            resolve(newRefund);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async refund(order, amount): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  async createCommissionRefunds(eventCommissions, options): Promise<any> {
    const refunds = [];
    const {
      event: { _id: eventId },
      commissions: {
        host: {
          user: { _id: hostUserId },
          amount: commissionAmount
        },
        participators
      }
    } = eventCommissions;
    const event = await EventsRepo.findById(eventId);
    // console.log(event);
    const refundRemainingAmount = this.getRemainingCommission(hostUserId, commissionAmount, event, participators);
    const hostRefund = await this.createCommisionRefund(hostUserId, event, '退款 - 发车人返现', commissionAmount, refundRemainingAmount, options);
    refunds.push(hostRefund);
    for (let i = 0; i < participators.length; i++) {
      const {
        user: { _id: userId },
        amount
      } = participators[i];
      const participatorRefund = await this.createCommisionRefund(userId, event, '退款 - 参团人返现', amount, 0, options);
      refunds.push(participatorRefund);
    }
    return refunds;
  }

  getRemainingCommission(hostUserId: string, hostCommissionAmount: number, event, participatorsCommission) {
    const { price: eventPrice } = event;
    let participatorCommission = undefined;
    for (let i = 0; i < participatorsCommission.length; i++) {
      const {
        user: { _id: userId },
        amount
      } = participatorsCommission[i];
      if (hostUserId.toString() === userId.toString()) {
        participatorCommission = participatorsCommission[i];
        break;
      }
    }
    if (participatorCommission) {
      const { amount } = participatorCommission;
      const remaining = hostCommissionAmount + amount - eventPrice;
      logger.info(`Found remaining commission for host ${hostUserId} is ${remaining}`);
      return remaining <= 0 ? 0 : remaining;
    } else {
      return 0;
    }
  }

  async createCommisionRefund(userId, event, refundDesc, amount, refundRemainingAmount, options): Promise<any> {
    const { _id: eventId, price } = event;
    const hostEventUser = await EventUsersRepo.findEventUser(eventId, userId, options);
    if (hostEventUser) {
      const { _id: eventUserId } = hostEventUser;
      const order = await OrdersRepo.findByParams({
        createdBy: userId,
        orderStatus: 'paid',
        objectId: eventUserId,
        type: 'event_join'
      });
      const refundParams = {
        user: userId,
        totalAmount: (price * 100).toFixed(),
        refundAmount: (amount * 100).toFixed(),
        refundRemainingAmount: (refundRemainingAmount * 100).toFixed(),
        outRefundNo: getRandomString(32),
        refundDesc,
        type: 'commission',
        status: 'created',
        createdAt: nowDate()
      };
      if (order) {
        const { _id: orderId, outTradeNo } = order;
        refundParams['order'] = orderId;
        refundParams['outTradeNo'] = outTradeNo;
      }
      const newRefund = await RefundsRepo.saveOrUpdate(refundParams, options);
      return newRefund;
    } else {
      // if there is no booking for this user, it should not happen, but if happens, create a refund anyway without objectId
      const refundParams = {
        user: userId,
        totalAmount: (amount * 100).toFixed(),
        refundAmount: (amount * 100).toFixed(),
        outRefundNo: getRandomString(32),
        refundDesc,
        type: 'commission',
        status: 'created',
        createdAt: nowDate()
      };
      const newRefund = await RefundsRepo.saveOrUpdate(refundParams, options);
      return newRefund;
    }
  }

  async getOrderByEvent(event) {
    const { id: eventId } = event;
    const offset = 0;
    const limit = 100;
    const eventUsers = await EventUsersRepo.findByEvent(eventId);
    const promises = eventUsers.map(async eventUser => {
      const {
        _id: objectId,
        user: { _id: createdBy }
      } = eventUser;
      const orders = await OrdersRepo.find({
        offset,
        limit,
        type: 'event_join',
        objectId,
        createdBy
      });
      return orders;
    });
    // wait until all promises are resolved
    const originalOrders = await Promise.all(promises);
    let orders = [];
    for (let i = 0; i < originalOrders.length; i++) {
      const originalOrder: any = originalOrders[i];
      const { data } = originalOrder;
      orders = orders.concat(data);
    }
    return orders;
  }

  getRefundStatusOkResponse(data) {
    const response = {
      returnCode: data.return_code,
      refundId: data.refund_id,
      refundFee: data.refund_fee,
      totalFee: data.total_fee,
      outTradeNo: data.out_trade_no,
      outRefundNo: data.out_refund_no
    };
    if (data.appid) {
      response['appId'] = data.appid;
    }
    if (data.refund_status) {
      response['refundStatus'] = data.refund_status;
    }
    if (data.cash_fee) {
      response['cashFee'] = data.cash_fee;
    }
    if (data.result_code) {
      response['resultCode'] = data.result_code;
    }
    if (data.return_msg) {
      response['returnMsg'] = data.return_msg;
    }
    if (data.trade_state) {
      response['tradeState'] = data.trade_state;
    }
    if (data.trade_state_desc) {
      response['tradeStateDesc'] = data.trade_state_desc;
    }
    if (data.fee_type) {
      response['feeType'] = data.fee_type;
    }
    if (data.transaction_id) {
      response['transactionId'] = data.transaction_id;
    }
    if (data.fee_type) {
      response['feeType'] = data.fee_type;
    }
    if (data.settlement_refund_fee) {
      response['settlementRefund_fee'] = data.settlement_refund_fee;
    }
    if (data.settlement_total_fee) {
      response['settlementTotalFee'] = data.settlement_total_fee;
    }
    if (data.time_end) {
      response['timeEnd'] = string2Date(data.time_end, true, 'YYYYMMDDHHmmss');
    }
    if (data.success_time) {
      response['refundedAt'] = string2Date(data.success_time, true, 'YYYY-MM-DD HH:mm:ss');
    }
    if (data.refund_account) {
      response['refundAccount'] = data.refund_account;
    }
    if (data.refund_request_source) {
      response['refundRequestSource'] = data.refund_request_source;
    }
    return response;
  }

  getRefundErrorResponse(data) {
    const response = {
      returnCode: data.return_code,
      returnMsg: data.return_msg
    };
    if (data.err_code) {
      response['errCode'] = data.err_code;
    }
    if (data.err_code_des) {
      response['errCodeDesc'] = data.err_code_des;
    }
    return response;
  }

  getPaymentStatusOkResponse(data) {
    const response = {
      returnCode: data.return_code,
      totalFee: data.total_fee,
      outTradeNo: data.out_trade_no
    };
    if (data.appid) {
      response['appId'] = data.appid;
    }
    if (data.prepay_id) {
      response['prepayId'] = data.prepay_id;
    }
    if (data.code_url) {
      response['codeUrl'] = data.code_url;
    }
    if (data.result_code) {
      response['resultCode'] = data.result_code;
    }
    if (data.return_msg) {
      response['returnMsg'] = data.return_msg;
    }
    if (data.device_info) {
      response['deviceInfo'] = data.device_info;
    }
    if (data.trade_state) {
      response['tradeState'] = data.trade_state;
    }
    if (data.trade_state_desc) {
      response['tradeStateDesc'] = data.trade_state_desc;
    }
    if (data.attach) {
      response['attach'] = data.attach;
    }
    if (data.bank_type) {
      response['bankType'] = data.bank_type;
    }
    if (data.trade_type) {
      response['tradeType'] = data.trade_type;
    }
    if (data.transaction_id) {
      response['transactionId'] = data.transaction_id;
    }
    if (data.fee_type) {
      response['feeType'] = data.fee_type;
    }

    if (data.time_end) {
      response['timeEnd'] = string2Date(data.time_end, true, 'YYYYMMDDHHmmss');
    }
    return response;
  }

  getPaymentErrorResponse(data) {
    const response = {
      returnCode: data.return_code,
      returnMsg: data.return_msg
    };
    if (data.err_code) {
      response['errCode'] = data.err_code;
    }
    if (data.err_code_des) {
      response['errCodeDesc'] = data.err_code_des;
    }
    return response;
  }

  getQueryPaymentSign(appid, nonceStr, outTradeNo) {
    const params = {
      appid: appid,
      mch_id: config.mch.mchId,
      nonce_str: nonceStr,
      out_trade_no: outTradeNo
    };

    return this.getSign(params, config.mch.key);
  }

  wxOrderQuerySendData(appid, nonceStr, outTradeNo, sign) {
    const data = `
			<xml>
			   <appid><![CDATA[${appid}]]></appid>
			   <mch_id><![CDATA[${config.mch.mchId}]]></mch_id>
			   <nonce_str><![CDATA[${nonceStr}]]></nonce_str>
			   <out_trade_no><![CDATA[${outTradeNo}]]></out_trade_no>
			   <sign><![CDATA[${sign}]]></sign>
			</xml>
		`;
    console.log(data, 'generating xml data');
    return data;
  }

  getRefundPaymentSign(appid, nonceStr, outTradeNo, outRefundNo, totalFee, refundFee, refundDesc, notifyUrl) {
    const params = {
      appid: appid,
      mch_id: config.mch.mchId,
      nonce_str: nonceStr,
      notify_url: notifyUrl,
      out_refund_no: outRefundNo,
      total_fee: Number(totalFee),
      refund_fee: Number(refundFee),
      refund_desc: refundDesc,
      out_trade_no: outTradeNo
    };

    return this.getSign(params, config.mch.key);
  }

  wxRefundSendData(appid, nonceStr, outTradeNo, outRefundNo, totalFee, refundFee, refundDesc, notifyUrl, sign) {
    const data = `
			<xml>
			   <appid><![CDATA[${appid}]]></appid>
			   <mch_id><![CDATA[${config.mch.mchId}]]></mch_id>
			   <nonce_str><![CDATA[${nonceStr}]]></nonce_str>
			   <notify_url><![CDATA[${notifyUrl}]]></notify_url>
			   <out_trade_no><![CDATA[${outTradeNo}]]></out_trade_no>
			   <out_refund_no><![CDATA[${outRefundNo}]]></out_refund_no>
			   <refund_fee><![CDATA[${refundFee}]]></refund_fee>
			   <total_fee><![CDATA[${totalFee}]]></total_fee>
			   <refund_desc><![CDATA[${refundDesc}]]></refund_desc>
			   <sign><![CDATA[${sign}]]></sign>
			</xml>
		`;
    console.log(data, 'generating xml data');
    return data;
  }

  //生成预支付签名
  getPrePaySign(appid, attach, body, openid, totalFee, notifyUrl, ip, nonceStr, outTradeNo) {
    const params = {
      appid: appid,
      attach: attach,
      body: body,
      mch_id: config.mch.mchId,
      nonce_str: nonceStr,
      notify_url: notifyUrl,
      openid: openid,
      out_trade_no: outTradeNo,
      spbill_create_ip: ip,
      total_fee: Number(totalFee),
      trade_type: 'JSAPI'
    };

    return this.getSign(params, config.mch.key);
  }

  //签名成功后，根据参数拼接组装成XML格式的数据，调用下单接口
  wxSendData(appid, attach, body, openid, totalFee, notifyUrl, ip, nonceStr, outTradeNo, sign) {
    const data = `
			<xml>
			   <appid><![CDATA[${appid}]]></appid>
			   <attach><![CDATA[${attach}]]></attach>
			   <body><![CDATA[${body}]]></body>
			   <mch_id><![CDATA[${config.mch.mchId}]]></mch_id>
			   <nonce_str><![CDATA[${nonceStr}]]></nonce_str>
			   <notify_url><![CDATA[${notifyUrl}]]></notify_url>
			   <openid><![CDATA[${openid}]]></openid>
			   <out_trade_no><![CDATA[${outTradeNo}]]></out_trade_no>
			   <spbill_create_ip><![CDATA[${ip}]]></spbill_create_ip>
			   <total_fee><![CDATA[${totalFee}]]></total_fee>
			   <trade_type><![CDATA[JSAPI]]></trade_type>
			   <sign><![CDATA[${sign}]]></sign>
			</xml>
		`;
    console.log(data, 'generating xml data');
    return data;
  }

  getPayParams(appId, prepayId) {
    const now = nowDate();
    const params = {
      appId,
      timeStamp: now.unix().toString(),
      // createdAt: nowDate(),
      nonceStr: getRandomString(32),
      package: `prepay_id=${prepayId}`,
      signType: 'MD5'
    };
    const paySign = this.getSign(params, config.mch.key);
    const response = Object.assign(params, { paySign, createdAt: now });
    return response;
  }

  getSign(params, key) {
    const string = this.raw(params) + '&key=' + key;
    logger.info(`sign string ${string}`);
    const sign = crypto
      .createHash('md5')
      .update(string)
      .digest('hex');
    return sign.toUpperCase();
  }

  //Object 转换成json并排序
  raw(args) {
    let keys = Object.keys(args);
    keys = keys.sort();
    const newArgs = {};
    keys.forEach(function(key) {
      newArgs[key] = args[key];
    });
    let string = '';
    for (const k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
  }

  isValidSign(data) {
    const dataToCheck = _.clone(data);
    const { sign } = dataToCheck;
    delete dataToCheck.sign;
    const generatedSign = this.getSign(dataToCheck, config.mch.key);
    console.log(generatedSign);
    console.log(sign);
    return generatedSign === sign;
  }
}

export default new OrderService();
