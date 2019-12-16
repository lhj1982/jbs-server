module.exports = {
  server: {
    port: 3000,
    entrypoint: `https://api.boogoogoo.com`
  },
  cache: {
    duration: 2 * 60 * 60 // cache in second
  },
  appId: 'wxf59749a45686779c',
  appSecret: '<app key>',
  mch: {
    mchId: '1560901281',
    key: '<merch key>',
    payNotifyUrl: 'https://api.boogoogoo.com/orders/wechat/pay_callback',
    refundNotifyUrl: 'https://api.boogoogoo.com/orders/wechat/refund_callback',
    certFile: __dirname + '/../apiclient_cert.pem',
    certKeyFile: __dirname + '/../apiclient_key.pem'
  },
  logDir: '/data/log/jbs-server',
  dbUri: 'mongodb://<username>:<password>@49.234.63.40:27017,49.234.63.40:27018,49.234.63.40:27019/jbs?replicaSet=rs0&maxPoolSize=512&authSource=admin',
  jwt: {
    issuer: 'ademes',
    secret: 'JARF2YXNTA46ZH8F4Q2TBFHWE8DSDJCXAMGQTSSMWZKSPWC8FMWSL9YXU5PELUFN',
    duration: 2592000
  },
  query: {
    offset: 0,
    limit: 10
  },
  qiniu: {
    bucket: 'jbs-server',
    accessKey: '<access key>',
    secretKey: '<access secret>',
    event: {
      qrcodeKeyPrefix: 'static/images/events/qrcode-dev',
      callbackUrl: 'https://api.boogoogoo.com/notifications/qrcode-upload-callback'
    }
  },
  sms: {
    templates: {},
    enabled: true,
    spCode: '1470',
    loginName: 'dyfhpy',
    password: '123456'
  }
};
