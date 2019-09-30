import config from '../config';
const qiniu = require('qiniu');

class FileService {
  uploadFile(key: string, localFile: string) {
    return new Promise((resolve, reject) => {
      const token = this.uptoken(config.qiniu.bucket, key);
      const extra = new qiniu.io.PutExtra();

      qiniu.io.putFile(token, key, localFile, extra, (err, ret) => {
        if (err) {
          // 上传成功， 处理返回值
          reject(err);
        } else {
          // 上传失败， 处理返回代码
          resolve(ret);
        }
      });
    });
  }

  getFile() {
    return null;
  }

  uptoken(bucket, key) {
    const putPolicy = new qiniu.rs.PutPolicy(bucket + ':' + key);
    return putPolicy.token();
  }
}

export default new FileService();
