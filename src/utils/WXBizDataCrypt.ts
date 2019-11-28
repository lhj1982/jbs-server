import config from '../config';
import logger from '../utils/logger';
const crypto = require('crypto');

function WXBizDataCrypt(appId, sessionKey) {
  this.appId = appId;
  this.sessionKey = sessionKey;
}

WXBizDataCrypt.prototype.decryptData = function(encryptedData, iv) {
  // base64 decode
  const sessionKey = Buffer.from(this.sessionKey, 'base64'); //new Buffer(this.sessionKey, 'base64');
  const decryptedData = Buffer.from(encryptedData, 'base64'); // new Buffer(encryptedData, 'base64');
  const decryptedIv = Buffer.from(iv, 'base64'); // new Buffer(iv, 'base64');
  let result;
  try {
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, decryptedIv);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    let decoded = decipher.update(decryptedData, 'binary', 'utf8');
    decoded += decipher.final('utf8');

    result = JSON.parse(decoded);
    logger.info(result);
  } catch (err) {
    logger.error(err);
    throw new Error('Illegal Buffer');
  }

  if (result.watermark.appid !== this.appId) {
    throw new Error('Illegal Buffer');
  }
  return result;
};

module.exports = WXBizDataCrypt;
