import { Request, Response, NextFunction, Router } from 'express';
import { ScriptsController } from '../controllers/scripts.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

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
      .get((req: Request, res: Response, next: NextFunction) => {
        // middleware
        console.log(`Request from: ${req.originalUrl}`);
        console.log(`Request type: ${req.method}`);
        next();
      }, this.scriptsController.getScripts)

      .post(verifyToken, permit({ domain: 'user', operations: ['create'] }), this.scriptsController.addScript);
    app.route('/scripts/:scriptId').get(this.scriptsController.getScript);
  }
}
