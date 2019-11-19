import config from '../config';
const axios = require('axios');
import logger from '../utils/logger';
import { pp, getRandomString } from '../utils/stringUtil';
import { nowDate } from '../utils/dateUtil';
import OrdersRepo from '../repositories/orders.repository';
import { ResourceAlreadyExist } from '../exceptions/custom.exceptions';
const ip = require('ip');
const crypto = require('crypto');
const xml = require('xml2js');

class OrderService {
  /**
   * Create new order, throw exception if error is duplicated.
   *
   * @param {[type]} order   [description]
   * @param {[type]} options =             {} [description]
   */
  async createOrder(order, options = {}) {
    const { createdBy, type, objectId } = order;
    const existingOrder = await OrdersRepo.findUnique(createdBy, type, objectId);
    if (existingOrder) {
      throw new ResourceAlreadyExist('Order', [createdBy, type, objectId]);
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
    const attach = 'boogoogoo event cost';
    const body = 'boogoogoo - eventJoin';
    const sign = this.getPrePaySign(appid, attach, body, openId, amount, config.mch.notifyUrl, ip.address(), nonceStr, outTradeNo);
    //通过参数和签名组装xml数据，用以调用统一下单接口
    const sendData = this.wxSendData(appid, attach, body, openId, amount, config.mch.notifyUrl, ip.address(), nonceStr, outTradeNo, sign);
    console.log(sign, 'sign');
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
          if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
            //获取预支付会话ID
            const prepayId = data.prepay_id[0];
            const payResult = this.getPayParams(appid, prepayId);
            // console.log(payResult);
            resolve(payResult);
            // return { code: 'SUCCESS', data: payResult };
          } else {
            // return { code: 'FAIL', error: data };
            resolve(this.getPaymentErrorResponse(data));
          }
        })
        .catch(error => {
          // return { code: 'FAIL', error };
          reject(error);
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
          if (data.return_code[0] == 'SUCCESS' && data.result_code[0] == 'SUCCESS') {
            const orderStatus = {
              appId: data.appid[0],
              deviceInfo: data.device_info[0],
              totalFee: data.total_fee[0],
              outTradeNo: data.out_trade_no[0],
              tradeState: data.trade_state[0],
              tradeStateDesc: data.trade_state_desc[0],
              timeEnd: data.time_end[0]
            };
            resolve(this.getPaymentStatusOkResponse(data));
          } else {
            resolve(this.getPaymentErrorResponse(data));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  getPaymentStatusOkResponse(data) {
    const response = {
      appId: data.appid[0],
      deviceInfo: data.device_info[0],
      totalFee: data.total_fee[0],
      outTradeNo: data.out_trade_no[0],
      tradeState: data.trade_state[0],
      tradeStateDesc: data.trade_state_desc[0]
    };
    if (data.time_end) {
      response['timeEnd'] = data.time_end[0];
    }
    return response;
  }

  getPaymentErrorResponse(data) {
    const response = {
      returnCode: data.return_code[0],
      returnMsg: data.return_msg[0]
    };
    if (data.err_code) {
      response['errCode'] = data.err_code[0];
    }
    if (data.err_code_des) {
      response['errCodeDesc'] = data.err_code_des[0];
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
    const params = {
      appId,
      timeStamp: nowDate()
        .unix()
        .toString(),
      nonceStr: getRandomString(32),
      package: `prepay_id=${prepayId}`,
      signType: 'MD5'
    };
    const paySign = this.getSign(params, config.mch.key);
    const response = Object.assign(params, { paySign });
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
}

export default new OrderService();
