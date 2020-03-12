import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import GameService from '../services/game.service';

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

  getScriptByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, playerId } = req.params;
    try {
      const script = await GameService.getScriptByPlayer(loggedInUser, gameId, playerId);
    } catch (err) {
      next(err);
    }
  };

  getScriptCluesByPlayer = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { gameId, playerId } = req.params;
    try {
    } catch (err) {
      next(err);
    }
  };
}
