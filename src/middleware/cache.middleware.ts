// import * as redis from 'redis';
import logger from '../utils/logger';
// const client = redis.createClient();

export default function cacheMiddleware(duration: number) {
  return (req, res, next) => {
    next();
    // const token = req.headers.authorization.split(' ')[1];
    // let key = '__expIress__' + req.originalUrl || req.url;
    // if (token) {
    //   key = key + '|' + token;
    // }
    // client.get(key, (err, reply) => {
    //   if (reply) {
    //     logger.debug(`Found hit in cache, key: ${key}, value: ${reply}`);
    //     res.send(JSON.parse(reply));
    //   } else {
    //     logger.debug(`No hit is found in cache, key: ${key}`);
    //     res.sendResponse = res.send;
    //     res.send = body => {
    //       client.set(key, body, 'EX', duration);
    //       res.sendResponse(body);
    //     };
    //     next();
    //   }
    // });
  };
}
