import { Request, Response, NextFunction } from 'express';
import { ShopsController } from '../controllers/shops.controller';
import { verifyToken } from '../middleware/verifyToken';
import cacheMiddleware from '../middleware/cache.middleware';
import config from '../config';

export class ShopsRoutes {
  shopsController: ShopsController = new ShopsController();

  routes(app): void {
    // Contact
    app
      .route('/shops')
      .get(
        cacheMiddleware(config.cache.duration),
        (req: Request, res: Response, next: NextFunction) => {
          // middleware
          console.log(`Request from: ${req.originalUrl}`);
          console.log(`Request type: ${req.method}`);
          next();
        },
        this.shopsController.getShops
      )

      .post(verifyToken, this.shopsController.addShop);
    app.route('/shops/:shopId/script/:scriptId').post(verifyToken, this.shopsController.addScript);
  }
}
