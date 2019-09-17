import { Request, Response } from 'express';
import AuthApi from '../api/auth';
import ScriptsRepo from '../repositories/scripts.repository';

export class ScriptsController {
  getScripts = async (req: Request, res: Response) => {
    try {
      const contact = await ScriptsRepo.find({});
      res.json(contact);
    } catch (err) {
      res.send(err);
    }
  };
}
