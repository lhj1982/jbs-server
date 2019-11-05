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

export { pp, escapeRegex, randomSerialNumber, getRandomInt, queryStringToJSON, replacePlacehoder, isMobileNumber, getRandomString };
