import { Request, Response, NextFunction } from 'express';
import { GamesController } from '../controllers/games.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import config from '../config';

export class GamesRoutes {
  gamesController: GamesController = new GamesController();

  routes(app): void {
    app.route('/games').post(verifyToken, this.gamesController.addGame);

    app.route('/games/:gameId/script-rundown/:playerId').get(verifyToken, this.gamesController.getScriptRundownByPlayer);
    app.route('/games/:gameId/clues/:playerId').get(verifyToken, this.gamesController.getScriptCluesByPlayer);
    app.route('/games/:gameId/join').post(verifyToken, this.gamesController.join);
    app.route('/games/:gameId/leave').post(verifyToken, this.gamesController.leave);

    app.route('/games/:gameId/clues/:scriptClueId').put(verifyToken, this.gamesController.updateGameScriptClue);
  }
}
