import { Request, Response } from 'express';
import AuthApi from '../api/auth';
import ShopsRepo from '../repositories/shops.repository';

export class ShopsController {
  getShops = async (req: Request, res: Response) => {
    try {
      const contact = await ShopsRepo.find({});
      res.json(contact);
    } catch (err) {
      res.send(err);
    }
  };
}
