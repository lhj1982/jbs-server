import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import ShopsRepo from '../repositories/shops.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';

export class ShopsController {
  getShops = async (req: Request, res: Response) => {
    try {
      const contact = await ShopsRepo.find({});
      res.json(contact);
    } catch (err) {
      res.send(err);
    }
  };

  addShop = async (req: Request, res: Response, next: NextFunction) => {
    const { key, name, address, mobile, phone, contactName, contactMobile, province, city, district } = req.body;
    if (!key) {
      next(new InvalidRequestException('AddShop', 'key'));
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
      next(new InvalidRequestException('AddShopScript', 'scriptId'));
      return;
    }
    if (!shopId) {
      next(new InvalidRequestException('AddShopScript', 'shopId'));
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
