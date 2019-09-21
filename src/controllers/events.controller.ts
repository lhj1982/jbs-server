import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import EventsRepo from '../repositories/events.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import * as moment from 'moment';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import config from '../config';

export class EventsController extends BaseController {
  getEvents = async (req: Request, res: Response) => {
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
      let result = await EventsRepo.find({ keyword, offset, limit });
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      res.send(err);
    }
  };

  addEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, numberOfPersons, price } = req.body;
    if (!scriptId) {
      next(new InvalidRequestException('AddEvent', 'scriptId'));
      return;
    }
    if (!shopId) {
      next(new InvalidRequestException('AddEvent', 'shopId'));
      return;
    }
    if (!hostUserId) {
      next(new InvalidRequestException('AddEvent', 'hostUserId'));
      return;
    }
    if (!numberOfPersons) {
      next(new InvalidRequestException('AddEvent', 'numberOfPersons'));
      return;
    }
    if (!price) {
      next(new InvalidRequestException('AddEvent', 'price'));
      return;
    }

    const script = await ScriptsRepo.findById(scriptId);
    if (!script) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }
    const shop = await ShopsRepo.findById(shopId);
    if (!shop) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    const hostUser = await UsersRepo.findById(hostUserId);
    if (!hostUser) {
      next(new ResourceNotFoundException('User', hostUserId));
      return;
    }

    const dtStartTime = moment(startTime, 'YYYY-MM-DD HH:mm:ss.SSSZ')
      .utc()
      .format();
    const dtEndTime = moment(endTime, 'YYYY-MM-DD HH:mm:ss.SSSZ')
      .utc()
      .format();
    console.log(dtStartTime);
    const newEvent = await EventsRepo.saveOrUpdate({
      shop: shopId,
      script: scriptId,
      startTime: dtStartTime,
      endTime: dtEndTime,
      hostUser: hostUserId,
      hostComment,
      numberOfPersons,
      price,
      createdAt: new Date()
    });
    res.json({ code: 'SUCCESS', data: newEvent });
  };

  joinEvent = async(req: Request, res: Response, next: NextFunction) => {
  	
  }
}
