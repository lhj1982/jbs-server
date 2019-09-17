import { Request, Response, NextFunction } from 'express';
import { ScriptsController } from '../controllers/scripts.controller';

export class ScriptsRoutes {
  scriptsController: ScriptsController = new ScriptsController();

  routes(app): void {
    // Contact
    app.route('/scripts').get((req: Request, res: Response, next: NextFunction) => {
      // middleware
      console.log(`Request from: ${req.originalUrl}`);
      console.log(`Request type: ${req.method}`);
      next();
    }, this.scriptsController.getScripts);
  }
}
