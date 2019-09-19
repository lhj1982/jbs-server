import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import ScriptsRepo from '../repositories/scripts.repository';
import { InvalidRequestException, ResourceAlreadyExist } from '../exceptions/custom.exceptions';

export class ScriptsController {
  getScripts = async (req: Request, res: Response) => {
    try {
      const contact = await ScriptsRepo.find({});
      res.json(contact);
    } catch (err) {
      res.send(err);
    }
  };

  addScript = async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req);
    const { key, name, description, minNumberOfPersons, maxNumberOfPersons, duration } = req.body;
    if (!key) {
      next(new InvalidRequestException('AddScript', 'key'));
      return;
    }
    const script = await ScriptsRepo.findOne({ key });
    // console.log(script);
    if (script) {
      next(new ResourceAlreadyExist(`Script`, key));
      return;
    }
    const newScript = await ScriptsRepo.saveOrUpdate({
      key,
      name,
      description,
      minNumberOfPersons,
      maxNumberOfPersons,
      duration,
      createdAt: new Date()
    });
    res.json({ code: 'SUCCESS', data: newScript });
  };
}
