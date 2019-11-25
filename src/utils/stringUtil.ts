const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = '>aXjR>&ht,Du5w^Z';

const pp = string => {
  return JSON.stringify(string);
};

const encrypt = text => {
  const cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

const decrypt = text => {
  const decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

const escapeRegex = text => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

const randomSerialNumber = (serialLength = 20) => {
  const chars = '1234567890';

  let randomSerial = '';
  let randomNumber;

  for (let i = 0; i < serialLength; i = i + 1) {
    randomNumber = Math.floor(Math.random() * chars.length);

    randomSerial += chars.substring(randomNumber, randomNumber + 1);
  }
  return randomSerial;
};

const getRandomString = (serialLength = 16) => {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let randomSerial = '';
  let randomNumber;

  for (let i = 0; i < serialLength; i = i + 1) {
    randomNumber = Math.floor(Math.random() * chars.length);

    randomSerial += chars.substring(randomNumber, randomNumber + 1);
  }
  return randomSerial;
};

const getRandomInt = max => {
  return Math.floor(Math.random() * Math.floor(max));
};

// result=0&description=发送短信成功&taskid=191011202300085909
const queryStringToJSON = data => {
  const pairs = data.split('&');

  const result = {};
  pairs.forEach(function(pair) {
    const pair1 = pair.split('=');
    result[pair1[0]] = decodeURIComponent(pair1[1] || '');
  });

  return JSON.parse(JSON.stringify(result));
};

const replacePlacehoder = (message, placeholder, replacement) => {
  const replace = `<${placeholder}>`;
  const re = new RegExp(replace, 'gi');
  return message.replace(re, replacement);
};

/**
 * Input data, normalize to normal json object.
 * 
 * { appid: [ 'wx2421b1c4370ec43b' ],
  attach: [ '支付测试' ],
  bank_type: [ 'CFT' ],
  fee_type: [ 'CNY' ],
  is_subscribe: [ 'Y' ],
  mch_id: [ '10000100' ],
  nonce_str: [ '5d2b6c2a8db53831f7eda20af46e531c' ],
  openid: [ 'oUpF8uMEb4qRXf22hE3X68TekukE' ],
  out_trade_no: [ '1409811653' ],
  result_code: [ 'SUCCESS' ],
  return_code: [ 'SUCCESS' ],
  sign: [ 'B552ED6B279343CB493C5DD0D78AB241' ],
  time_end: [ '20140903131540' ],
  total_fee: [ '1' ],
  coupon_fee: [ '10', '100' ],
  coupon_count: [ '1' ],
  coupon_type: [ 'CASH' ],
  coupon_id: [ '10000' ],
  trade_type: [ 'JSAPI' ],
  transaction_id: [ '1004400740201409030005092168' ] }

 * @type {[type]}
 */
const normalizePaymentData = (data): any => {
  const response = {};
  for (const attr in data) {
    if (data[attr]) {
      response[attr] = data[attr][0];
    }
  }
  return response;
};

const md5 = (str: string) => {
  const hash = crypto
    .createHash('md5')
    .update(str, 'utf8')
    .digest('hex');
  return hash;
};

const decryption = (data, key, iv) => {
  if (!data) {
    return '';
  }
  // console.log(data);
  iv = iv || '';
  const clearEncoding = 'utf8';
  const cipherEncoding = 'base64';
  const cipherChunks = [];
  const decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
  decipher.setAutoPadding(true);
  cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
  cipherChunks.push(decipher.final(clearEncoding));
  return cipherChunks.join('');
};

const isMobileNumber = phone => {
  let flag = false;
  let message = '';
  const myreg = /^(((13[0-9]{1})|(14[0-9]{1})|(17[0-9]{1})|(15[0-3]{1})|(15[4-9]{1})|(18[0-9]{1})|(199))+\d{8})$/;
  if (phone == '') {
    // console.log("手机号码不能为空");
    message = '手机号码不能为空！';
  } else if (phone.length != 11) {
    //console.log("请输入11位手机号码！");
    message = '请输入11位手机号码！';
  } else if (!myreg.test(phone)) {
    //console.log("请输入有效的手机号码！");
    message = '请输入有效的手机号码！';
  } else {
    flag = true;
  }
  if (message != '') {
    // alert(message);
  }
  return { valid: flag, message };
};

export { pp, escapeRegex, randomSerialNumber, getRandomInt, queryStringToJSON, replacePlacehoder, isMobileNumber, getRandomString, normalizePaymentData, md5, decryption };
