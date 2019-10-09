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
export { escapeRegex, randomSerialNumber, getRandomInt };
