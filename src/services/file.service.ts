import config from '../config';
import logger from '../utils/logger';
const qiniu = require('qiniu');
//构建私有空间的链接
const mac = new qiniu.auth.digest.Mac(config.qiniu.accessKey, config.qiniu.secretKey);

class FileService {
  uploadFile(key: string, fileStream: string) {
    return new Promise((resolve, reject) => {
      const qiniuConfig = new qiniu.conf.Config();
      const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
      const putExtra = new qiniu.form_up.PutExtra();
      const options = {
        scope: config.qiniu.bucket,
        // callbackUrl: `${config.server.entrypoint}/notifications/qrcode-upload-callback`, // 这个地方需要一个回调通知接口
        // callbackBody: 'key=$(key)&hash=$(etag)&bucket=$(bucket)&fsize=$(fsize)&name=$(x:name)'
      };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);

      formUploader.put(uploadToken, key, fileStream, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          logger.error(`Error when uploading file key: ${key}, ${respErr.toString()}, stack: ${respErr.stack}`);
          throw respErr;
        }
        if (respInfo.statusCode == 200) {
          resolve(respBody);
        } else {
          logger.error(`Error when uploading file key: ${key}, status: ${respInfo.statusCode}, body: ${JSON.stringify(respBody)}`);
          reject(respBody);
        }
      });
    });
  }

  getFile() {
    return null;
  }
}

export default new FileService();
