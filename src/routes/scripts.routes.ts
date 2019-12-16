import { Request, Response, NextFunction, Router } from 'express';
import { ScriptsController } from '../controllers/scripts.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import config from '../config';

export class ScriptsRoutes {
  scriptsController: ScriptsController = new ScriptsController();
  router: Router;

  constructor() {
    this.router = Router();
  }

  routes(app): void {
    // Scripts
    app
      .route('/scripts')
      .get(
        cacheMiddleware(config.cache.duration),
        (req: Request, res: Response, next: NextFunction) => {
          // middleware
          console.log(`Request from: ${req.originalUrl}`);
          console.log(`Request type: ${req.method}`);
          next();
        },
        this.scriptsController.getScripts
      )

      .post(verifyToken, permit({ domain: 'script', operations: ['createScript'] }), this.scriptsController.addScript);

    app.route('/scripts/feed').get(cacheMiddleware(config.cache.duration), this.scriptsController.getScriptsFeed);
    app.route('/scripts/:scriptId').get(cacheMiddleware(config.cache.duration), this.scriptsController.getScript);
  }
}
