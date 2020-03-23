import { Request, Response, NextFunction } from 'express';
import { GamesController } from '../controllers/games.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import config from '../config';

export class GamesRoutes {
  gamesController: GamesController = new GamesController();

  routes(app): void {
    app
      .route('/games')
      .get(this.gamesController.getGames)
      .post(verifyToken, permit({ domain: 'game', operations: ['addGame'] }), this.gamesController.addGame);

    app.route('/games/join').post(verifyToken, this.gamesController.join);
    app.route('/games/leave').post(verifyToken, this.gamesController.leave);

    app.route('/games/:roomId/code/:code').get(this.gamesController.getGameScriptByRoomAndCode);
    app
      .route('/games/:gameId')
      .put(verifyToken, permit({ domain: 'game', operations: ['updateGame'] }), this.gamesController.updateGame)
      .delete(verifyToken, permit({ domain: 'game', operations: ['deleteGame'] }), this.gamesController.deleteGame);
    app.route('/games/:gameId/script-rundown/:playerId').get(verifyToken, cacheMiddleware(config.cache.duration), this.gamesController.getScriptRundownByPlayer);
    app.route('/games/:gameId/clues/:playerId').get(verifyToken, cacheMiddleware(config.cache.duration), this.gamesController.getGameScriptCluesByPlayer);

    app.route('/games/:gameId/clues/:scriptClueId').put(verifyToken, this.gamesController.updateGameScriptClue);
  }
}
