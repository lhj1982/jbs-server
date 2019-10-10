import { Request, Response, NextFunction } from 'express';
import { PricesController } from '../controllers/prices.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class PricesRoutes {
  pricesController: PricesController = new PricesController();

  routes(app): void {
    //
    app.route('/prices/price-schema').post(verifyToken, permit({ domain: 'price-schema', operations: ['create'] }), this.pricesController.addPriceSchema);
    app
      .route('/discount-rules')
      .get(verifyToken, this.pricesController.getDiscountRules)
      .post(verifyToken, this.pricesController.addDiscountRule);
  }
}
