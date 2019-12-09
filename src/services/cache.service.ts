import * as redis from 'redis';
import logger from '../utils/logger';
import config from '../config';
const client = redis.createClient();

class CacheService {
  keyPrefix = '__expIress__';

  async purgeUserCache(user: any) {
    const { id } = user;

    await this.purgeCacheByKey(`${this.keyPrefix}/users/${id}`);
    await this.purgeCacheByKey(`${this.keyPrefix}/profile/my-events`);
  }

  async purgeEventCache(event: any) {
    await this.purgeCacheByKey(`${this.keyPrefix}/profile/my-events`);
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
