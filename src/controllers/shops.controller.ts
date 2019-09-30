import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import ShopsRepo from '../repositories/shops.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import config from '../config';

export class ShopsController extends BaseController {
  getShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let offset = parseInt(req.query.offset);
      let limit = parseInt(req.query.limit);
      const { keyword } = req.query;
      if (!offset) {
        offset = config.query.offset;
      }
      if (!limit) {
        limit = config.query.limit;
      }

      let result = await ShopsRepo.find({ keyword, offset, limit });
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      res.send(err);
    }
  };

  addShop = async (req: Request, res: Response, next: NextFunction) => {
    const { key, name, address, mobile, phone, contactName, contactMobile, province, city, district, wechatId, wechatName } = req.body;
    if (!key) {
      next(new InvalidRequestException('AddShop', ['key']));
      return;
    }
    const shop = await ShopsRepo.findOne({ key });
    if (shop) {
      next(new ResourceAlreadyExist(`Shop`, key));
      return;
    }
    const newShop = await ShopsRepo.saveOrUpdate({
      key,
      name,
      address,
      mobile,
      phone,
      wechatId,
      wechatName,
      contactName,
      contactMobile,
      province,
      city,
      district,
      createdAt: new Date()
    });
    res.json({ code: 'SUCCESS', data: newShop });
  };

  addScript = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId } = req.params;
    if (!scriptId) {
      next(new InvalidRequestException('AddShopScript', ['scriptId']));
      return;
    }
    if (!shopId) {
      next(new InvalidRequestException('AddShopScript', ['shopId']));
      return;
    }
    const shop = await ShopsRepo.findById(shopId);
    if (!shop) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    const script = await ScriptsRepo.findById(scriptId);
    if (!script) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }
    const idstrArr = shop.scripts.map(_ => {
      return _.toString();
    });
    // only add script when it does not exist in shop
    if (idstrArr.indexOf(scriptId) === -1) {
      shop.scripts.push(scriptId);
      const newShop = await ShopsRepo.saveOrUpdate(shop);
      res.json({ code: 'SUCCESS', data: newShop });
    } else {
      res.json({ code: 'SUCCESS', data: shop });
    }
  };
}
