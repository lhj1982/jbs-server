import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import EventsRepo from '../repositories/events.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import DiscountRulesMapRepo from '../repositories/discountRulesMap.repository';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException, EventIsFullBookedException, EventCannotCompleteException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import config from '../config';
import { string2Date, formatDate, addDays } from '../utils/dateUtil';
import * as _ from 'lodash';

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

  getEventsByScriptAndShop = async (req: Request, res: Response) => {
    try {
      let offset = parseInt(req.query.offset);
      let limit = parseInt(req.query.limit);
      const { scriptId, shopId } = req.params;
      if (!offset) {
        offset = config.query.offset;
      }
      if (!limit) {
        limit = config.query.limit;
      }
      let result = await EventsRepo.find({ scriptId, shopId, offset, limit });
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
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, numberOfPersons, price } = req.body;
    let { numberOfOfflinePersons } = req.body;
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
    if (!numberOfOfflinePersons) {
      numberOfOfflinePersons = 0;
    }
    const numberOfAvailableSpots = numberOfPersons - numberOfOfflinePersons;
    const numberOfParticipators = 0;
    const dtStartTime = formatDate(startTime, config.eventDateFormatParse);
    const dtEndTime = formatDate(endTime, config.eventDateFormatParse);
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };

      const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
      let discountRule = undefined;
      if (applicableDiscountRules.length > 0) {
        discountRule = applicableDiscountRules[0]._id;
      }

      const newEvent = await EventsRepo.saveOrUpdate(
        {
          shop: shopId,
          script: scriptId,
          startTime: dtStartTime,
          endTime: dtEndTime,
          hostUser: hostUserId,
          hostComment,
          numberOfPersons,
          numberOfOfflinePersons,
          numberOfParticipators,
          numberOfAvailableSpots,
          price,
          discountRule,
          createdAt: new Date()
        },
        opts
      );
      await session.commitTransaction();
      await EventsRepo.endSession();
      res.json({ code: 'SUCCESS', data: newEvent });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      throw err;
    }
  };

  /**
   * Update event status, numberOfOfflinePersons
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { status, numberOfOfflinePersons } = req.body;
    const { loggedInUser } = res.locals;
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const updateData = {};
    if (status) {
      updateData['status'] = status;
    }
    if (numberOfOfflinePersons) {
      updateData['numberOfOfflinePersons'] = numberOfOfflinePersons;
    }
    const eventToUpdate = Object.assign(event, updateData);
    const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, {});
    res.json({ code: 'SUCCESS', data: newEvent });
  };

  /**
   * User choose to join the event.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  joinUserEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { userName, source, userId, mobile } = req.body;
    const { loggedInUser } = res.locals;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    if (userId && userName) {
      next(new InvalidRequestException('JoinEvent', [userId, userName]));
      return;
    }
    if (source != 'online' && source != 'offline') {
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
    if (userId != loggedInUser._id) {
      next(new AccessDeinedException(''));
      return;
    }
    // if (userId) {
    //   const user = await UsersRepo.findById(userId);
    //   if (!user) {
    //     next(new ResourceNotFoundException('User', userId));
    //     return;
    //   }
    // }

    // get participators for given event
    const eventUsers = await EventUsersRepo.findByEvent(eventId);
    const newEvent = await this.updateEventParticpantsNumber(event, eventUsers);
    const { numberOfAvailableSpots } = newEvent;
    if (numberOfAvailableSpots <= 0) {
      next(new EventIsFullBookedException(eventId));
      return;
    }

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const newEventUser = await EventUsersRepo.saveOrUpdate(
        {
          event: eventId,
          user: userId,
          userName,
          source,
          mobile,
          status: 'unpaid',
          createdAt: new Date()
        },
        opts
      );

      await session.commitTransaction();
      await EventsRepo.endSession();
      res.json({ code: 'SUCCESS', data: newEventUser });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      throw err;
    }
  };

  getEventDetails = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { _id: scriptId } = event.script;
    const { _id: shopId } = event.shop;
    const priceWeeklySchema = await EventsRepo.findPriceWeeklySchemaByEvent(scriptId, shopId);
    console.log(priceWeeklySchema);
    const resp = _.merge(event, priceWeeklySchema);
    res.json({
      code: 'SUCCESS',
      data: resp
    });
  };

  getPriceWeeklySchema = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId } = req.query;
    const script = await ScriptsRepo.findById(scriptId);
    const shop = await ShopsRepo.findById(shopId);
    if (!shop) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    if (!script) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }
    const priceWeeklySchema = await EventsRepo.findPriceWeeklySchemaByEvent(scriptId, shopId);
    res.json({ code: 'SUCCESS', data: priceWeeklySchema });
  };

  getDiscountRules = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId } = req.query;
    const script = await ScriptsRepo.findById(scriptId);
    const shop = await ShopsRepo.findById(shopId);
    if (!shop) {
      next(new ResourceNotFoundException('Shop', shopId));
    }
    const discountRules = await EventsRepo.findDiscountRulesByShopAndScript(shopId, scriptId);
    res.json({ code: 'SUCCESS', data: discountRules });
  };

  /**
   * Used for update event users. for example, user cancel join event,
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  cancelEventUser = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { loggedInUser } = res.locals;
    const { userId, status } = req.body;
    if (status != 'cancelled') {
      next(new InvalidRequestException('EventUser', ['status']));
      return;
    }

    if (userId != loggedInUser._id) {
      next(new AccessDeinedException(''));
    }

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const eventUser = await EventUsersRepo.findEventUser(eventId, userId);
      const eventUserToUpdate = Object.assign(eventUser, { status: status });
      const newEventUser = await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
      res.json({ code: 'SUCCESS', data: newEventUser });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      throw err;
    }
  };

  /**
   * Orgnizer can mark event user paid or not.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  updateEventUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { loggedInUser } = res.locals;
    const { userId, status } = req.body;
    if (['paid', 'unpaid'].indexOf(status) == -1) {
      next(new InvalidRequestException('EventUser', ['status']));
      return;
    }
    // if (userId != loggedInUser._id) {
    // 	next(new AccessDeinedException(''));
    // }

    const eventUser = await EventUsersRepo.findEventUser(eventId, userId);

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const eventUserToUpdate = Object.assign(eventUser, { status: status });
      const newEventUser = await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);

      await session.commitTransaction();
      await EventsRepo.endSession();

      res.json({ code: 'SUCCESS', data: newEventUser });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      throw err;
    }
  };

  getAvailableDiscountRules = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId, startTime } = req.query;
    const { loggedInUser } = res.locals;
    if (!shopId) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    if (!scriptId) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }

    const availableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
    // console.log(availableDiscountRules);
    res.json({
      code: 'SUCCESS',
      data: availableDiscountRules
    });
  };

  generateAvailableDiscountRules = async (scriptId, shopId, startTime) => {
    const availableDiscountRulesRaw = await this.getAvailableDiscountRulesFromDB(scriptId, shopId, startTime);
    // console.log(availableDiscountRulesRaw);
    const availableDiscountRules = availableDiscountRulesRaw
      .filter(rule => {
        const { discountRule } = rule;
        return discountRule != null;
      })
      .map(rule => {
        // console.log(rule);
        const { discountRule } = rule;
        return discountRule;
      });
    return availableDiscountRules;
  };

  getAvailableDiscountRulesFromDB = async (scriptId, shopId, startTime) => {
    let result = await DiscountRulesMapRepo.findByShopAndScript(shopId, scriptId, startTime);
    if (result.length === 0) {
      result = await DiscountRulesMapRepo.findByShopAndScript(shopId, undefined, startTime);
    }
    return result;
  };

  completeEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { status } = req.body;
    const { loggedInUser } = res.locals;
    if (['completed'].indexOf(status) == -1) {
      next(new InvalidRequestException('Event', ['status']));
      return;
    }

    // get participators for given event
    const eventUsers = await EventUsersRepo.findByEvent(eventId);
    let newEvent = await this.updateEventParticpantsNumber(event, eventUsers);

    // // update event user number
    // const updateData = this.getUpdatedEventParticipators(event, 'joinEvent', eventUsers.length);
    // const eventToUpdate = Object.assign(event, updateData);
    // const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, {});
    // const { numberOfAvailableSpots } = newEvent;
    if (!this.canCompleteEvent(event, eventUsers)) {
      next(new EventCannotCompleteException(eventId));
      return;
    }

    const eventToUpdate = Object.assign(newEvent, { status });
    newEvent = await EventsRepo.saveOrUpdate(eventToUpdate);
    const eventCommissions = this.generateEventCommission(newEvent);
    res.json({ code: 'SUCCESS', data: newEvent });
  };


  generateEventCommission = (event) => {

  };

  /**
   * Update event participants stats.
   *
   * @param {[type]} event      [description]
   * @param {[type]} eventUsers [description]
   */
  updateEventParticpantsNumber = async (event, eventUsers) => {
    const { numberOfPersons, numberOfOfflinePersons } = event;
    let { numberOfAvailableSpots, numberOfParticipators } = event;
    if (!numberOfAvailableSpots) {
      numberOfAvailableSpots = 0;
    }
    if (!numberOfParticipators) {
      numberOfParticipators = 0;
    }
    numberOfParticipators = eventUsers.length;
    numberOfAvailableSpots = numberOfPersons - numberOfParticipators - numberOfOfflinePersons;
    const eventToUpdate = Object.assign(event, {
      numberOfAvailableSpots,
      numberOfParticipators,
      numberOfOfflinePersons
    });
    const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, {});
    return newEvent;
  };

  canCompleteEvent = (event, eventUsers) => {
  	let allPaid = true;
  	for (let i=0; i<eventUsers.length; i++) {
  		const eventUser = eventUsers[i];
  		const { status } = eventUser;
  		if (status === 'unpaid') {
  			allPaid = true;
  			break;
  		}
  	}
    const { numberOfAvailableSpots, numberOfParticipators, numberOfOfflinePersons, numberOfPersons } = event;
    const numberOfOnlinePersons = eventUsers.length;
    return allPaid && (numberOfOnlinePersons + numberOfOfflinePersons >= numberOfPersons);
  };
}
