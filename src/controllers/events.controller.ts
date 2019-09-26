import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import EventsRepo from '../repositories/events.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import config from '../config';
import { string2Date, formatDate, addDays } from '../utils/dateUtil';

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

  getEventsByDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const offset = 0;
      const limit = 100;
      const { date } = req.params;
      const from = formatDate(date);
      const to = addDays(date, 1);
      console.log(`Find event between ${from} and ${to}...`);
      const result = await EventsRepo.findByDate(from, to);
      res.json({ code: 'SUCCESS', data: result });
    } catch (err) {
      console.error(err);
      res.send(err);
    }
  };

  addEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, numberOfPersons } = req.body;
    if (!scriptId) {
      next(new InvalidRequestException('AddEvent', ['scriptId']));
      return;
    }
    if (!shopId) {
      next(new InvalidRequestException('AddEvent', ['shopId']));
      return;
    }
    if (!hostUserId) {
      next(new InvalidRequestException('AddEvent', ['hostUserId']));
      return;
    }
    if (!numberOfPersons) {
      next(new InvalidRequestException('AddEvent', ['numberOfPersons']));
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

    const dtStartTime = formatDate(startTime, config.eventDateFormatParse);
    const dtEndTime = formatDate(endTime, config.eventDateFormatParse);
    const newEvent = await EventsRepo.saveOrUpdate({
      shop: shopId,
      script: scriptId,
      startTime: dtStartTime,
      endTime: dtEndTime,
      hostUser: hostUserId,
      hostComment,
      numberOfPersons,
      price: 100,
      createdAt: new Date()
    });
    res.json({ code: 'SUCCESS', data: newEvent });
  };

  joinEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { userId, userName, source } = req.body;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    if (userId && userName) {
      next(new InvalidRequestException('JoinEvent', [userId, userName]));
      return;
    }
    if (source != 'online' || source != 'offline') {
      next(new InvalidRequestException('JoinEvent', [source]));
      return;
    }
    if (source === 'online' && !userId) {
      next(new InvalidRequestException('JoinEvent', [source, userId]));
      return;
    }
    if (source === 'offline' && !userName) {
      next(new InvalidRequestException('JoinEvent', [source, userName]));
      return;
    }
    if (userId) {
      const user = await UsersRepo.findById(userId);
      if (!user) {
        next(new ResourceNotFoundException('User', userId));
        return;
      }
    }
    const newEventUser = await EventUsersRepo.saveOrUpdate({
      eventId,
      userId,
      userName,
      source,
      paid: false,
      createdAt: new Date()
    });
    res.json({ code: 'SUCCESS', data: newEventUser });
  };

  getEventDetails = async (req: Request, res: Response, next: NextFunction) => {
    // console.log(new Date());
    // console.log(moment());
    // console.log(moment.utc());
    // console.log(moment.utc(1566640351349));
    // console.log(moment.unix(1566640351));
    // console.log(moment('2019-02-03 10:00:00'));
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    res.json({ code: 'SUCCESS', data: event });
  };
}
