import config from '../config';
import logger from '../utils/logger';
import { Duplex } from 'stream';
const qiniu = require('qiniu');
//构建私有空间的链接
const mac = new qiniu.auth.digest.Mac(config.qiniu.accessKey, config.qiniu.secretKey);
const qiniuConfig = new qiniu.conf.Config();

class FileService {
  uploadFileBase64(key: string, fileBase64Str: string) {
    return new Promise((resolve, reject) => {
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
      const putExtra = new qiniu.form_up.PutExtra();
      const options = {
        scope: config.qiniu.bucket
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
      qiniuConfig.zone = qiniu.zone.Zone_z2;
      const formUploader = new qiniu.form_up.FormUploader(qiniuConfig);
      const putExtra = new qiniu.form_up.PutExtra();
      const options = {
        scope: config.qiniu.bucket
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

  getFile(eventId: string, key: string, bucket: string) {
    return new Promise((resolve, reject) => {
      const options = {
        limit: 1,
        prefix: key
      };
      const bucketManager = new qiniu.rs.BucketManager(mac, qiniuConfig);
      bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo) {
        if (err) {
          throw err;
        }
        if (respInfo.statusCode == 200) {
          const items = respBody.items;
          items.forEach(function(item) {
            const respBody = {
              hash: item.hash,
              key: item.key
            };
            resolve(respBody);
          });
        } else {
          reject(respBody);
        }
      });
    });
  }
}

export default new FileService();
