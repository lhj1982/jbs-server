import config from '../config';
import logger from '../utils/logger';
import { Duplex } from 'stream';
const qiniu = require('qiniu');
//构建私有空间的链接
const mac = new qiniu.auth.digest.Mac(config.qiniu.accessKey, config.qiniu.secretKey);

class FileService {
  uploadFileBase64(key: string, fileBase64Str: string) {
    return new Promise((resolve, reject) => {
      const qiniuConfig = new qiniu.conf.Config();
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
      const putExtra = new qiniu.form_up.PutExtra();
      const options = {
        scope: config.qiniu.bucket
        // callbackUrl: `${config.server.entrypoint}/notifications/qrcode-upload-callback`, // 这个地方需要一个回调通知接口
        //     callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
        // callbackBodyType: 'application/json'
      };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);

      const buff = Buffer.from(fileBase64Str, 'base64');
      const Readable = require('stream').Readable;
      const s = new Readable();
      s.push(buff);
      s.push(null);
      // const stream = new Duplex();
      // stream.push(buff);
      // stream.push(null);

      formUploader.putStream(uploadToken, key, s, putExtra, (respErr, respBody, respInfo) => {
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

  uploadFile(key: string, filePath: string) {
    return new Promise((resolve, reject) => {
      const qiniuConfig = new qiniu.conf.Config();
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
      const putExtra = new qiniu.form_up.PutExtra();
      const options = {
        scope: config.qiniu.bucket
        // callbackUrl: `${config.server.entrypoint}/notifications/qrcode-upload-callback`, // 这个地方需要一个回调通知接口
        //     callbackBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
        // callbackBodyType: 'application/json'
      };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(mac);

      formUploader.putFile(uploadToken, key, filePath, putExtra, (respErr, respBody, respInfo) => {
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
