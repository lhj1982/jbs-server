import config from '../config';
const crypto = require('crypto');

// function WXBizDataCrypt(appId, sessionKey) {
//   this.appId = appId;
//   this.sessionKey = sessionKey;
// }

const decryptData = (data, sessionKey, initialVector) => {
  // base64 decode
  const { appId } = config;
  console.log(sessionKey);
  console.log(initialVector);
  const decryptedSessionKey = Buffer.from(sessionKey, 'base64');
  // const aa = new Buffer(this.sessionKey, 'base64');
  const decryptedData = Buffer.from(data, 'base64');
  const iv = Buffer.from(initialVector, 'base64').toString('utf8'); //new Buffer(iv, 'base64');
  // console.log(aa);
  let result;
  try {
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', decryptedSessionKey, iv);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    let decoded = decipher.update(decryptedData, 'binary', 'utf8');
    decoded += decipher.final('utf8');

    result = JSON.parse(decoded);
  } catch (err) {
    throw new Error('Illegal Buffer');
  }

  if (result.watermark.appid !== appId) {
    throw new Error('Illegal Buffer');
  }

  return result;
};

export { decryptData };
