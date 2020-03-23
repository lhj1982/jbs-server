// import * as redis from 'redis';
import logger from '../utils/logger';
import config from '../config';
// const client = redis.createClient();
// client.auth(config.cache.password);
const Redis = require('ioredis');
const client = new Redis({
  port: 6379, // Redis port
  host: '127.0.0.1', // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: config.cache.password,
  db: 0
});

export default function cacheMiddleware(duration: number) {
  return (req, res, next) => {
    // next();
    const { loggedInUser } = res.locals;

    let key = '__expIress__' + req.originalUrl || req.url;
    if (loggedInUser) {
      const { id: loggedInUserId } = loggedInUser;
      key = key + '|' + loggedInUserId;
    }
    client.get(key, (err, reply) => {
      if (reply) {
        logger.debug(`Found hit in cache, key: ${key}, value: ${reply}`);
        res.send(JSON.parse(reply));
      } else {
        logger.debug(`No hit is found in cache, key: ${key}`);
        res.sendResponse = res.send;
        res.send = body => {
          client.set(key, body, 'EX', duration);
          res.sendResponse(body);
        };
        next();
      }
    });
  };
}
