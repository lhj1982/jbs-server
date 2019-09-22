module.exports = {
  server: {
    port: 3000,
    entrypoint: `http://jbs.weijinglong.com:3000`
  },
  dbUri: 'mongodb://localhost:27017/jbs',
  jwt: {
    issuer: 'ademes',
    secret: 'JARF2YXNTA46ZH8F4Q2TBFHWE8DSDJCXAMGQTSSMWZKSPWC8FMWSL9YXU5PELUFN',
    duration: 7200
  },
  query: {
    offset: 0,
    limit: 10
  }
};
