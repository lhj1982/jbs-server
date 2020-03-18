import { Request } from 'express';
import * as redis from 'redis';
import logger from '../utils/logger';
import config from '../config';
const client = redis.createClient();
client.auth(config.cache.password);

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

  async purgeGameScriptClueCache(gameId: string, fromPlayerId: string, toPlayerId: string, loggedInUser: any) {
    // __expIress__/games/5e6f7cd9da88d848dba957f4/clues/0|5da594c4a745082f2c5980e1
    let key1 = `__expIress__/games/${gameId}/clues/${fromPlayerId}`;
    let key2 = `__expIress__/games/${gameId}/clues/${toPlayerId}`;
    if (loggedInUser) {
      const { id } = loggedInUser;
      key1 = key1 + '|' + id;
      key2 = key2 + '|' + id;
    }
    await this.purgeCacheByKey(key1);
    await this.purgeCacheByKey(key2);
  }

  // async purgeCacheBySearch(searchKey: string): Promise<any> {
  //   const cursor = '0';
  //   const resp = await this.scan(cursor, searchKey);
  //   const { cursor: newCursor, data: keys } = resp;
  //   console.log(keys);

  //   // return new Promise(async (resolve, reject) => {
  //   const promises = keys.map(key => {
  //     return new Promise((resolve1, reject1) => {
  //       logger.debug(`Purge cache, ${key}`);
  //       // resolve1([]);
  //       client.del(key, (err, data) => {
  //         if (err) {
  //           logger.error(`Error when deleting cache key ${key}`);
  //           resolve1(err);
  //         } else {
  //           resolve1(data);
  //         }
  //       });
  //     });
  //   });
  //   await Promise.all(promises);
  // }

  // async scan(cursor: string, key: string): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     client.scan(cursor, 'MATCH', key, 'COUNT', '100', async (err, reply) => {
  //       if (err) {
  //         logger.error(`Error when search cache key ${key}`);
  //         resolve({ cursor: '0', data: [] });
  //       } else {
  //         cursor = reply[0];
  //         const keys = reply[1];
  //         resolve({ cursor, data: keys });
  //       }
  //     });
  //   });
  // }

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
