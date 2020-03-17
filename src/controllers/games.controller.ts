import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import GamesRepo from '../repositories/games.repository';
import GameScriptCLuesRepo from '../repositories/gameScriptClues.repository';
import GameService from '../services/game.service';
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

export class GamesController extends BaseController {
  getGames = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let offset = parseInt(req.query.offset);
      let limit = parseInt(req.query.limit);
      const { keyword, filter: filterStr, sort: sortStr } = req.query;
      let filterToUpdate = { status: ['ready'], availableSpots: -1 };
      let sortToUpdate = {};
      if (filterStr) {
        const filter = JSON.parse(decodeURIComponent(filterStr));
        filterToUpdate = Object.assign(filterToUpdate, filter);
        // console.log(filterToUpdate);
      }
      if (sortStr) {
        const sort = JSON.parse(decodeURIComponent(sortStr));
        sortToUpdate = Object.assign(sortToUpdate, sort);
      }
      if (!offset) {
        offset = config.query.offset;
      }
      if (!limit) {
        limit = config.query.limit;
      }
      // console.log(filterToUpdate);
      let result = await GamesRepo.find({ keyword, offset, limit }, filterToUpdate, sortToUpdate);
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getGameScriptByRoomAndCode = async (req: Request, res: Response, next: NextFunction) => {
    const { roomId, code } = req.params;
    try {
      const gameScript = await GameService.getGameScriptByRoomAndCode(roomId, code);
      res.json({ code: 'SUCCESS', data: gameScript });
    } catch (err) {
      next(err);
    }
  };

  addGame = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    try {
      const game = await GameService.addGame(req.body);
      res.json({ code: 'SUCCESS', data: game });
    } catch (err) {
      next(err);
    }
  };

  join = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { roomId, playerId, code } = req.body;
    try {
      const games = await GamesRepo.findByParams({
        roomId,
        code,
        status: 'ready'
      });
      if (!games || games.length === 0) {
        throw new ResourceNotFoundException('Game', `${roomId}|${code}`);
      }
      if (games.length > 1) {
        logger.warn(`More than one game is found`);
        throw new InvalidRequestException('Game', ['roomId', 'code', 'status']);
      }
      const game = games[0];
      const gamePlayer = await GameService.joinGame(loggedInUser, game, playerId);
      res.json({ code: 'SUCCESS', data: gamePlayer });
    } catch (err) {
      next(err);
    }
  };

  leave = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { roomId, playerId } = req.body;
    try {
      const games = await GamesRepo.findByParams({ roomId, status: 'ready' });
      if (!games || games.length === 0) {
        throw new ResourceNotFoundException('Game', `${roomId}`);
      }
      if (games.length > 1) {
        logger.warn(`More than one game is found`);
        throw new InvalidRequestException('Game', ['roomId', 'status']);
      }
      const game = games[0];
      const gamePlayer = await GameService.leaveGame(loggedInUser, game, playerId);
      res.json({ code: 'SUCCESS', data: gamePlayer });
    } catch (err) {
      next(err);
    }
  };

  getScriptRundownByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, playerId } = req.params;
    try {
      const scriptRundown = await GameService.getScriptRundownByPlayer(loggedInUser, gameId, playerId);
      res.json({ code: 'SUCCESS', data: scriptRundown });
    } catch (err) {
      next(err);
    }
  };

  getGameScriptCluesByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, playerId } = req.params;
    try {
      const gameScriptClues = await GameService.getGameScriptCluesByPlayer(loggedInUser, gameId, playerId);
      res.json({ code: 'SUCCESS', data: gameScriptClues });
    } catch (err) {
      next(err);
    }
  };

  updateGameScriptClue = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, scriptClueId } = req.params;
    try {
      const game = await GamesRepo.findById(gameId);
      if (!game) {
        throw new ResourceNotFoundException('Game', gameId);
      }
      const gameScriptClues = await GameScriptCLuesRepo.find({
        game: gameId,
        scriptClue: scriptClueId
      });
      if (!gameScriptClues || gameScriptClues.length === 0) {
        throw new ResourceNotFoundException('GameScriptClue', `${gameId}|${scriptClueId}`);
      }
      if (gameScriptClues.length > 1) {
        logger.warn(`Found more than one scriptClue for game ${gameId}, scriptClue ${scriptClueId}, pick the first one`);
      }
      const gameScriptClue = gameScriptClues[0];
      const newGameScriptClue = await GameService.updateGameScriptClue(loggedInUser, game, gameScriptClue, req.body);
      res.json({ code: 'SUCCESS', data: newGameScriptClue });
    } catch (err) {
      next(err);
    }
  };
}
