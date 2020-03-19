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

  async purgeGameScriptClueCache(game: any, fromPlayerId: string, toPlayerId: string, loggedInUser: any) {
    // __expIress__/games/5e6f7cd9da88d848dba957f4/clues/0|5da594c4a745082f2c5980e1
    // if (toPlayerId) {
    //   const { id: gameId } = game;
    //   const key1 = `__expIress__/games/${gameId}/clues/${fromPlayerId}`;
    //   const key2 = `__expIress__/games/${gameId}/clues/${toPlayerId}`;
    //   // if (loggedInUser) {
    //   //   const { id } = loggedInUser;
    //   //   key1 = key1 + '|' + id;
    //   // }

    //   // const gamePlayer = await GamePlayersRepo.findByGameAndPlayerId(gameId, toPlayerId);
    //   // if (gamePlayer) {
    //   //   // console.log(gamePlayer);
    //   //   const { user: toPlayerUserId } = gamePlayer;
    //   //   if (toPlayerUserId) {
    //   //     key2 = key2 + '|' + toPlayerUserId;
    //   //   }
    //   // }
    //   // await this.purgeCacheByKey(key1);
    //   // await this.purgeCacheByKey(key2);
    //   await this.deleteKeysByPattern(`${key1}*`);
    //   await this.deleteKeysByPattern(`${key2}*`);
    // } else {
    //   // else purge cache for all players
    //   const { id: gameId, players } = game;
    //   await this.deleteKeysByPattern(`__expIress__/games/${gameId}/clues/*`);
    //   // const promises = players.map(async player => {
    //   //   const { playerId } = player;
    //   //   let key = `__expIress__/games/${gameId}/clues/${playerId}`;
    //   //   const gamePlayer = await GamePlayersRepo.findByGameAndPlayerId(gameId, playerId);
    //   //   if (gamePlayer) {
    //   //     // console.log(gamePlayer);
    //   //     const { user: toPlayerUserId } = gamePlayer;
    //   //     if (toPlayerUserId) {
    //   //       key = key + '|' + toPlayerUserId;
    //   //     }
    //   //   }
    //   //   await this.purgeCacheByKey(key);
    //   // });
    //   // await Promise.all(promises);
    // }

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
