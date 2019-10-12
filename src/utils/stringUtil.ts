const crypto = require('crypto');

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
export { escapeRegex, randomSerialNumber, getRandomInt, queryStringToJSON, replacePlacehoder };
