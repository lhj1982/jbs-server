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
    // await this.purgeCacheByKey(userKey);
    // await this.purgeCacheByKey(profileKey);
  }

  async purgeEventCache(event: any, req: Request) {
    const token = req.headers.authorization.split(' ')[1];
    let myEventsKey = `${this.keyPrefix}/profile/my-events`;
    let eventsKey = `${this.keyPrefix}/events?*`;
    if (token) {
      myEventsKey = myEventsKey + '|' + token;
      eventsKey = eventsKey + '|' + token;
    }
    // await this.purgeCacheByKey(myEventsKey);
    // // await this.purgeCacheBySearch(eventsKey);
  }

  async purgeCacheBySearch(searchKey: string): Promise<any> {
    const cursor = '0';
    const resp = await this.scan(cursor, searchKey);
    const { cursor: newCursor, data: keys } = resp;
    console.log(keys);

    // return new Promise(async (resolve, reject) => {
    const promises = keys.map(key => {
      return new Promise((resolve1, reject1) => {
        logger.debug(`Purge cache, ${key}`);
        // resolve1([]);
        client.del(key, (err, data) => {
          if (err) {
            logger.error(`Error when deleting cache key ${key}`);
            resolve1(err);
          } else {
            resolve1(data);
          }
        });
      });
    });
    await Promise.all(promises);
  }

  async scan(cursor: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      client.scan(cursor, 'MATCH', key, 'COUNT', '100', async (err, reply) => {
        if (err) {
          logger.error(`Error when search cache key ${key}`);
          resolve({ cursor: '0', data: [] });
        } else {
          cursor = reply[0];
          const keys = reply[1];
          resolve({ cursor, data: keys });
        }
      });
    });
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
