import { Request } from 'express';
import * as redis from 'redis';
import logger from '../utils/logger';
import config from '../config';
const client = redis.createClient();

class CacheService {
  keyPrefix = '__expIress__';

  async purgeUserCache(user: any, req: Request) {
    const token = req.headers.authorization.split(' ')[1];
    const { id } = user;
    let userKey = `${this.keyPrefix}/users/${id}`;
    let profileKey = `${this.keyPrefix}/profile/my-events`;
    if (token) {
      userKey = userKey + '|' + token;
      profileKey = profileKey + '|' + token;
    }
    await this.purgeCacheByKey(userKey);
    await this.purgeCacheByKey(profileKey);
  }

  async purgeEventCache(event: any, req: Request) {
    const token = req.headers.authorization.split(' ')[1];
    let myEventsKey = `${this.keyPrefix}/profile/my-events`;
    if (token) {
      myEventsKey = myEventsKey + '|' + token;
    }
    await this.purgeCacheByKey(myEventsKey);
  }

  async purgeCacheByKey(key: string): Promise<any> {
    logger.debug(`Purge cache, ${key}`);
    return new Promise((resolve, reject) => {
      client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

export default new CacheService();
