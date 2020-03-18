import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import GamesRepo from '../repositories/games.repository';
import GamePlayersRepo from '../repositories/gamePlayers.repository';
import GameScriptCluesRepo from '../repositories/gameScriptClues.repository';
import CacheService from './cache.service';
import { nowDate, string2Date, formatDate, addDays, add, getDate } from '../utils/dateUtil';
import { randomSerialNumber } from '../utils/stringUtil';
import config from '../config';
import {
  InvalidRequestException,
  ResourceAlreadyExist,
  ResourceNotFoundException,
  AccessDeniedException,
  UserIsBlacklistedException,
  CannotJoinGameException,
  CannotLeaveGameException
} from '../exceptions/custom.exceptions';
import logger from '../utils/logger';

class GameService {
  /**
   * Add new game.
   * 1. add new game
   * 2. add new game players
   * 3. add game clues
   * @param {[type]} params [description]
   */
  async addGame(params) {
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, price, code, hostUserMobile, hostUserWechatId } = params;
    // let { numberOfOfflinePersons, isHostJoin, supportPayment } = req.body;
    if (!scriptId) {
      throw new InvalidRequestException('AddGame', ['scriptId']);
    }
    if (!shopId) {
      throw new InvalidRequestException('AddGame', ['shopId']);
    }
    if (!hostUserId) {
      throw new InvalidRequestException('AddGame', ['hostUserId']);
    }
    if (!hostUserMobile) {
      throw new InvalidRequestException('AddGame', ['hostUserMobile']);
    }
    if (!hostUserWechatId) {
      throw new InvalidRequestException('AddGame', ['hostUserWechatId']);
    }
    if (!startTime) {
      throw new InvalidRequestException('AddGame', ['startTime']);
    }
    if (!code) {
      throw new InvalidRequestException('AddGame', ['code']);
    }
    const script = await ScriptsRepo.findById(scriptId, true);
    if (!script) {
      throw new ResourceNotFoundException('Script', scriptId);
    }
    const shop = await ShopsRepo.findById(shopId);
    if (!shop) {
      throw new ResourceNotFoundException('Shop', shopId);
    }
    const hostUser = await UsersRepo.findById(hostUserId);
    if (!hostUser) {
      throw new ResourceNotFoundException('User', hostUserId);
    }
    const { minNumberOfPersons, duration, rundowns, clues } = script;
    if (!rundowns) {
      logger.warn(`Script does not have any rundowns`);
      throw new InvalidRequestException('AddGame', ['scriptId']);
    }

    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const dtStartTime = formatDate(startTime, config.eventDateFormatParse);
      const dtEndTime = add(startTime, duration, 'm');

      const opts = { session };
      const game = await GamesRepo.findUnique({
        shop: shopId,
        script: scriptId,
        startTime: dtStartTime,
        status: 'ready',
        hostUser: hostUserId
      });
      if (game) {
        throw new ResourceAlreadyExist('Game', ['shop', 'script', 'startTime', 'status', 'hostUser']);
      }
      // create a new game
      const newGame = await GamesRepo.saveOrUpdate(
        {
          shop: shopId,
          script: scriptId,
          startTime: dtStartTime,
          endTime: dtEndTime,
          hostUser: hostUserId,
          hostUserMobile,
          hostUserWechatId,
          hostComment,
          numberOfPersons: minNumberOfPersons,
          roomId: randomSerialNumber(8),
          code,
          price,
          status: 'ready',
          createdAt: nowDate()
        },
        opts
      );
      const { _id: gameId } = newGame;
      // create gamePlayers entries for each player
      const gamePlayersPromises = rundowns.map(async rundown => {
        const { playerId } = rundown;
        let gamePlayerToAdd = {
          game: gameId,
          playerId
        };
        if (playerId === '0') {
          gamePlayerToAdd = Object.assign(gamePlayerToAdd, {
            user: hostUserId
          });
        }
        // console.log(gamePlayerToAdd);
        return await GamePlayersRepo.saveOrUpdate(gamePlayerToAdd, opts);
      });
      await Promise.all(gamePlayersPromises);

      // create game script clues list
      const gameScriptCluespromises = clues.map(async clue => {
        const { _id: scriptClueId } = clue;
        const gameScriptClueToAdd = {
          game: gameId,
          scriptClue: scriptClueId,
          owner: '0', // default all clues are owned by DM
          isPublic: false
        };
        return await GameScriptCluesRepo.saveOrUpdate(gameScriptClueToAdd, opts);
      });
      await Promise.all(gameScriptCluespromises);

      await session.commitTransaction();
      await GamesRepo.endSession();
      return newGame;
    } catch (err) {
      await session.abortTransaction();
      await GamesRepo.endSession();
      throw err;
    }
  }

  async joinGame(user: any, game: any, playerId: string) {
    const { _id: userId } = user;
    const { _id: gameId, code } = game;
    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { players, code: roomCode } = game;

      let matchedPlayer = players.find(player => {
        const { user: srcUserId } = player;
        return srcUserId && srcUserId.toString() === userId.toString();
      });
      //  If found logged in user already in players but as another playerId, throw an error
      // same user can only take one player in one game
      if (matchedPlayer && matchedPlayer.playerId !== playerId) {
        throw new CannotJoinGameException(gameId, `${userId} has already taken another player`);
      }

      matchedPlayer = players.find(player => {
        const { playerId: srcPlayerId } = player;
        return srcPlayerId === playerId;
      });
      if (roomCode != code) {
        throw new CannotJoinGameException(gameId, `${code} is not valid`);
      }
      if (!matchedPlayer) {
        throw new CannotJoinGameException(gameId, `${playerId} is not valid player`);
      }
      const { user } = matchedPlayer;
      if (user) {
        throw new CannotJoinGameException(gameId, `${playerId} is already taken`);
      }

      const gamePlayerToUpdate = Object.assign(matchedPlayer.toObject(), {
        user: userId,
        updatedAt: nowDate()
      });
      const newGamePlayer = await GamePlayersRepo.saveOrUpdate(gamePlayerToUpdate, opts);
      await session.commitTransaction();
      await GamesRepo.endSession();
      return newGamePlayer;
    } catch (err) {
      await session.abortTransaction();
      await GamesRepo.endSession();
      throw err;
    }
  }

  async leaveGame(user: any, game: any, playerId: string) {
    const { _id: userId } = user;
    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { _id: gameId, players } = game;
      const matchedPlayer = players.find(player => {
        const { user: srcUserId } = player;
        return srcUserId && userId.toString() === srcUserId.toString();
      });
      if (!matchedPlayer) {
        throw new CannotLeaveGameException(gameId, `You are not joined yet`);
      }
      const { playerId: srcPlayerId } = matchedPlayer;
      // check if the player id is matched
      if (srcPlayerId != playerId) {
        throw new CannotLeaveGameException(gameId, `Player id is not matched`);
      }

      const gamePlayerToUpdate = Object.assign(matchedPlayer.toObject(), {
        user: undefined,
        updatedAt: nowDate()
      });
      // console.log(gamePlayerToUpdate);
      const newGamePlayer = await GamePlayersRepo.saveOrUpdate(gamePlayerToUpdate, opts);
      await session.commitTransaction();
      await GamesRepo.endSession();
      return newGamePlayer;
    } catch (err) {
      await session.abortTransaction();
      await GamesRepo.endSession();
      throw err;
    }
  }

  async getScriptRundownByPlayer(loggedInUser: any, gameId: string, playerId: string) {
    try {
      const game = await GamesRepo.findById(gameId, ['rundowns']);
      if (!game) {
        throw new ResourceNotFoundException('Game', gameId);
      }
      const { script } = game;
      const { rundowns } = script;
      const scriptRundown = rundowns.find(rundown => {
        const { playerId: pId } = rundown;
        return pId === playerId;
      });
      return scriptRundown;
    } catch (err) {
      throw err;
    }
  }

  async getGameScriptCluesByPlayer(loggedInUser: any, gameId: string, playerId: string) {
    try {
      const game = await GamesRepo.findById(gameId, ['rundowns']);
      if (!game) {
        throw new ResourceNotFoundException('Game', gameId);
      }
      const gameScriptClues = await GameScriptCluesRepo.findGameScriptCluesByPlayerId(gameId, playerId);
      return gameScriptClues.map(_ => {
        const { scriptClue, isPublic, owner, id, _id } = _;
        return { scriptClue, isPublic, owner, id, _id };
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Update game script clue. It's used when DM try to distribute clues to players.
   *
   * @param {any} loggedInUser   [description]
   * @param {any} game           [description]
   * @param {any} gameScriptClue [description]
   */
  async updateGameScriptClue(loggedInUser: any, game: any, gameScriptClue: any, params: any) {
    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { playerId: playerIdToUpdate, isPublic, read } = params;
      const { id: gameId, players } = game;
      const { owner } = gameScriptClue;
      const { id: loggedInUserId } = loggedInUser;
      let gameScriptClueToUpdate = gameScriptClue.toObject();
      if (typeof playerIdToUpdate !== 'undefined') {
        const player = this.getPlayerByUser(players, loggedInUserId);
        if (!player) {
          throw new AccessDeniedException(loggedInUserId, 'You are not in the game.');
        }
        gameScriptClueToUpdate = Object.assign(gameScriptClueToUpdate, {
          owner: playerIdToUpdate,
          updatedAt: nowDate()
        });
      }

      if (typeof isPublic !== 'undefined') {
        gameScriptClueToUpdate = Object.assign(gameScriptClueToUpdate, {
          isPublic,
          updatedAt: nowDate()
        });
      }
      if (typeof read !== 'undefined') {
        gameScriptClueToUpdate = Object.assign(gameScriptClueToUpdate, {
          read,
          updatedAt: nowDate()
        });
      }
      const newGameScriptClue = await GameScriptCluesRepo.saveOrUpdate(gameScriptClueToUpdate, opts);
      // flush cache
      await CacheService.purgeGameScriptClueCache(game, owner, playerIdToUpdate, loggedInUser);
      await session.commitTransaction();
      await GamesRepo.endSession();
      return newGameScriptClue;
    } catch (err) {
      await session.abortTransaction();
      await GamesRepo.endSession();
      throw err;
    }
  }

  getPlayerByUser(players, userId: string) {
    const player = players.find(player => {
      // console.log(player);
      const { user: gamePlayerId } = player;
      // console.log(gamePlayerId + ' , ' + userId);
      return gamePlayerId && gamePlayerId.toString() === userId;
    });
    return player;
  }

  async getGameScriptByRoomAndCode(roomId: string, code: string) {
    const games = await GamesRepo.findByParams({
      roomId,
      code,
      status: 'ready'
    });
    if (games.length === 0) {
      return null;
    }
    if (games.length > 1) {
      logger.warn(`More than one game is found`);
      throw new InvalidRequestException('Game', ['roomId', 'code']);
    }
    return games[0];
  }
}

export default new GameService();
