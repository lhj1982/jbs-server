import { Request, Response, NextFunction } from 'express';
import { ShopsController } from '../controllers/shops.controller';

export class ShopsRoutes {
  shopsController: ShopsController = new ShopsController();

  routes(app): void {
    // Contact
    app.route('/shops').get((req: Request, res: Response, next: NextFunction) => {
      // middleware
      console.log(`Request from: ${req.originalUrl}`);
      console.log(`Request type: ${req.method}`);
      next();
    }, this.shopsController.getShops);
  }
}
