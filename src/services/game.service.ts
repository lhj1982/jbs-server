import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import GamesRepo from '../repositories/games.repository';
import GamePlayersRepo from '../repositories/gamePlayers.repository';
import GameScriptCluesRepo from '../repositories/gameScriptClues.repository';
import { nowDate, string2Date, formatDate, addDays, add, getDate } from '../utils/dateUtil';
import { getRandomString } from '../utils/stringUtil';
import config from '../config';
import {
  InvalidRequestException,
  ResourceAlreadyExist,
  ResourceNotFoundException,
  AccessDeniedException,
  EventCannotCreateException,
  EventCannotUpdateException,
  EventIsFullBookedException,
  EventCannotCompleteException,
  EventCannotCancelException,
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
    const script = await ScriptsRepo.findById(scriptId);
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

  async joinGame(user: any, gameId: string, playerId: string, code: string) {
    const { _id: userId } = user;
    if (!gameId) {
      throw new InvalidRequestException('JoinGame', ['gameId']);
    }
    const game = await GamesRepo.findById(gameId);
    if (!game) {
      throw new ResourceNotFoundException('Game', gameId);
    }
    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { players, code: roomCode } = game;
      const matchedPlayer = players.find(player => {
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

  async leaveGame(user: any, gameId: string, playerId: string) {
    const { _id: userId } = user;
    if (!gameId) {
      throw new InvalidRequestException('LeaveGame', ['gameId']);
    }
    const game = await GamesRepo.findById(gameId);
    if (!game) {
      throw new ResourceNotFoundException('Game', gameId);
    }
    const session = await GamesRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const { players } = game;
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

  async getScriptByPlayer(loggedInUser: any, gameId: string, playerId: string) {
    try {
      const game = await GamesRepo.findById(gameId);
      if (!game) {
        throw new ResourceNotFoundException('Game', gameId);
      }
    } catch (err) {
      throw err;
    }
  }
}

export default new GameService();
