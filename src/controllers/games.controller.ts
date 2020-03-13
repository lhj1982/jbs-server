import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import GamesRepo from '../repositories/games.repository';
import GameScriptCLuesRepo from '../repositories/gameScriptClues.repository';
import GameService from '../services/game.service';

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
    const { gameId } = req.params;
    const { playerId, code } = req.body;
    try {
      const gamePlayer = await GameService.joinGame(loggedInUser, gameId, playerId, code);
      res.json({ code: 'SUCCESS', data: gamePlayer });
    } catch (err) {
      next(err);
    }
  };

  leave = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId } = req.params;
    const { playerId } = req.body;
    try {
      const gamePlayer = await GameService.leaveGame(loggedInUser, gameId, playerId);
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

  getScriptCluesByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, playerId } = req.params;
    try {
      const gameScriptClues = await GameService.getScriptCluesByPlayer(loggedInUser, gameId, playerId);
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
        throw new ResourceNotFoundException('GameScriptClue', scriptClueId);
      }
      if (gameScriptClues.length > 1) {
        logger.warn(`Found more than one scriptClue for game #{gameId}, scriptClue ${scriptClueId}, pick the first one`);
      }
      const gameScriptClue = gameScriptClues[0];
      const newGameScriptClue = await GameService.updateGameScriptClue(loggedInUser, game, gameScriptClue, req.body);
      res.json({ code: 'SUCCESS', data: newGameScriptClue });
    } catch (err) {
      next(err);
    }
  };
}
