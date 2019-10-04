import { Request, Response, NextFunction } from 'express';
import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import PricesRepo from '../repositories/prices.repository';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import * as _ from 'lodash';

export class PricesController extends BaseController {
  addPriceSchema = async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, scriptId, priceSchema } = req.body;
    const script = await ScriptsRepo.findById(scriptId);
    const shop = await ShopsRepo.findById(shopId);
    if (!script) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }
    if (!shop) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    const priceWeeklySchema = await PricesRepo.findByShopAndScript(shopId, scriptId);
    const priceWeeklySchemaToUpdate = {
      script: scriptId,
      shop: shopId,
      priceSchema
    };
    // if (priceWeeklySchema) {
    //   priceWeeklySchemaToUpdate = _.merge(priceWeeklySchema, { priceSchema }); // Object.assign({}, ...priceWeeklySchema);
    //   console.log(priceWeeklySchemaToUpdate);
    //   // priceWeeklySchemaToUpdate['priceSchema'] = priceSchema;
    // } else {
    //   priceWeeklySchemaToUpdate = {
    //     shop: shopId,
    //     script: scriptId,
    //     priceSchema: priceSchema
    //   };
    // }
    console.log(priceWeeklySchemaToUpdate);
    const newPriceWeeklySchema = await PricesRepo.saveOrUpdatePriceSchema(priceWeeklySchemaToUpdate);
    res.json({ code: 'SUCCESS', data: newPriceWeeklySchema });
  };

  addDiscountRule = async (req: Request, res: Response, next: NextFunction) => {
    const { key, description, timeDescription, timeSpan, days, discount } = req.body;
    const discountRule = await PricesRepo.saveOrUpdateDiscountRule({
      key,
      description,
      timeDescription,
      timeSpan,
      days,
      discount
    });
    res.json({ code: 'SUCCESS', data: discountRule });
  };
}
