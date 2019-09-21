import { Request, Response, NextFunction } from 'express';
import { ShopsController } from '../controllers/shops.controller';
import { verifyToken } from '../middleware/verifyToken';

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

    app
      .use(verifyToken)
      .route('/shops')
      .post(this.shopsController.addShop);
    app
      .use(verifyToken)
      .route('/shops/:shopId/script/:scriptId')
      .post(this.shopsController.addScript);
  }
}
