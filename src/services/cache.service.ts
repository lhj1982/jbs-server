import { Request } from 'express';
import logger from '../utils/logger';
import config from '../config';
import GamesRepo from '../repositories/games.repository';
import GamePlayersRepo from '../repositories/gamePlayers.repository';
const Redis = require('ioredis');
const client = new Redis({
  port: 6379, // Redis port
  host: '127.0.0.1', // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: config.cache.password,
  db: 0
});
// client.auth(config.cache.password);

class CacheService {
  keyPrefix = '__expIress__';

  async purgeUserCache(user: any) {
    const { id } = user;
    await this.deleteKeysByPattern(`__expIress__/profile/*`);
    await this.deleteKeysByPattern(`__expIress__/users/${id}/*`);
    // const token = req.headers.authorization.split(' ')[1];
    // const { id } = user;
    // let userKey = `${this.keyPrefix}/users/${id}`;
    // let profileKey = `${this.keyPrefix}/profile/my-events`;
    // if (token) {
    //   userKey = userKey + '|' + token;
    //   profileKey = profileKey + '|' + token;
    // }
    // // await this.purgeCacheByKey(userKey);
    // // await this.purgeCacheByKey(profileKey);
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

  async purgeGameScriptClueCache(game: any, fromPlayerId: string, toPlayerId: string, loggedInUser: any) {
    const { id: gameId, players } = game;
    await this.deleteKeysByPattern(`__expIress__/games/${gameId}/clues/*`);
  }

  //key example "prefix*"
  getKeysByPattern(key) {
    return new Promise((resolve, reject) => {
      const stream = client.scanStream({
        // only returns keys following the pattern of "key"
        match: key,
        // returns approximately 100 elements per call
        count: 100
      });

      const keys = [];
      stream.on('data', function(resultKeys) {
        // `resultKeys` is an array of strings representing key names
        for (let i = 0; i < resultKeys.length; i++) {
          keys.push(resultKeys[i]);
        }
      });
      stream.on('end', function() {
        resolve(keys);
      });
    });
  }

  //key example "prefix*"
  deleteKeysByPattern(key) {
    const stream = client.scanStream({
      // only returns keys following the pattern of "key"
      match: key,
      // returns approximately 100 elements per call
      count: 100
    });

    const keys = [];
    stream.on('data', function(resultKeys) {
      // `resultKeys` is an array of strings representing key names
      for (let i = 0; i < resultKeys.length; i++) {
        logger.debug(`Purge cache key ${resultKeys[i]}`);
        keys.push(resultKeys[i]);
      }
    });
    stream.on('end', function() {
      logger.info(`${keys.length} cache entries has purged`);
      if (keys.length > 0) {
        client.unlink(keys);
      }
    });
  }
}

export default new CacheService();
