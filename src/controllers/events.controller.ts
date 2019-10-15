import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import EventsRepo from '../repositories/events.repository';
import ScriptsRepo from '../repositories/scripts.repository';
import UsersRepo from '../repositories/users.repository';
import ShopsRepo from '../repositories/shops.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import DiscountRulesMapRepo from '../repositories/discountRulesMap.repository';
import {
  InvalidRequestException,
  ResourceAlreadyExist,
  ResourceNotFoundException,
  AccessDeinedException,
  EventIsFullBookedException,
  EventCannotCompleteException,
  EventCannotCancelException
} from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import MessageService from '../services/message.service';
import config from '../config';
import { string2Date, formatDate, addDays, add } from '../utils/dateUtil';
// import * as _ from 'lodash';

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
      const { status } = req.query;
      // default status filter
      let statusArr = ['ready', 'completed'];
      if (status) {
        statusArr = status.split(',');
      }
      const from = formatDate(date);
      const to = addDays(date, 1);
      console.log(`Find event between ${from} and ${to}...`);
      const result = await EventsRepo.findByDate(from, to, {
        status: statusArr
      });
      res.json({ code: 'SUCCESS', data: result });
    } catch (err) {
      console.error(err);
      res.send(err);
    }
  };

  getEventsCountByDate = async (req: Request, res: Response, next: NextFunction) => {};

  addEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, numberOfPersons, price, hostUserMobile, hostUserWechatId } = req.body;
    let { isHostJoin } = req.body;
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
    if (!hostUserMobile) {
      next(new InvalidRequestException('AddEvent', ['hostUserMobile']));
      return;
    }
    if (!hostUserWechatId) {
      next(new InvalidRequestException('AddEvent', ['hostUserWechatId']));
      return;
    }
    if (!startTime) {
      next(new InvalidRequestException('AddEvent', ['startTime']));
      return;
    }
    // if (!numberOfPersons) {
    //   next(new InvalidRequestException('AddEvent', ['numberOfPersons']));
    //   return;
    // }

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
    const { minNumberOfPersons, maxNumberOfPersons } = script;
    if (!minNumberOfPersons || !maxNumberOfPersons) {
      next(new InvalidRequestException('AddEvent', ['minNumberOfPersons', 'maxNumberOfPersons']));
      return;
    }
    if (!numberOfOfflinePersons) {
      numberOfOfflinePersons = 0;
    }
    if (!isHostJoin) {
      isHostJoin = true;
    }
    const { loggedInUser } = res.locals;
    const minNumberOfAvailableSpots = minNumberOfPersons - numberOfOfflinePersons;
    const maxNumberOfAvailableSpots = maxNumberOfPersons - numberOfOfflinePersons;
    const numberOfParticipators = 0;
    let newEvent;
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const { duration } = script;

      const dtStartTime = formatDate(startTime, config.eventDateFormatParse);
      const dtEndTime = add(startTime, duration, 'm');

      const opts = { session };
      const { mobile } = loggedInUser;
      // update user mobile if user does not have mobile
      if (!mobile) {
        const userToUpdate = Object.assign(loggedInUser, {
          mobile: hostUserMobile
        });

        await UsersRepo.saveOrUpdateUser(userToUpdate, opts);
      }

      const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
      let discountRule = undefined;
      if (applicableDiscountRules.length > 0) {
        discountRule = applicableDiscountRules[0];
      }

      newEvent = await EventsRepo.saveOrUpdate(
        {
          shop: shopId,
          script: scriptId,
          startTime: dtStartTime,
          endTime: dtEndTime,
          hostUser: hostUserId,
          hostUserMobile,
          hostUserWechatId,
          hostComment,
          minNumberOfPersons,
          maxNumberOfPersons,
          numberOfOfflinePersons,
          numberOfParticipators,
          minNumberOfAvailableSpots,
          maxNumberOfAvailableSpots,
          price,
          discountRule,
          isHostJoin,
          createdAt: new Date()
        },
        opts
      );
      // console.log(newEvent);
      if (isHostJoin) {
        const newEventUser = await EventUsersRepo.saveOrUpdate(
          {
            event: newEvent.id,
            user: hostUserId,
            undefined,
            source: 'online',
            mobile: hostUserMobile,
            wechatId: hostUserWechatId,
            status: 'unpaid',
            createdAt: new Date()
          },
          opts
        );
      }
      newEvent = Object.assign(newEvent.toObject(), {
        shop,
        script,
        hostUser: loggedInUser
      });
      // console.log(newEvent);
      // save notifications in db and send sms if necessary
      await MessageService.saveNewEventNotifications(newEvent, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
    // get participators for given event
    const eventUsers = await EventUsersRepo.findByEvent(newEvent.id);
    newEvent = await this.updateEventParticpantsNumber(newEvent, eventUsers);
    res.json({ code: 'SUCCESS', data: newEvent });
  };

  /**
   * Update event status, numberOfOfflinePersons
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { numberOfOfflinePersons, hostComment, price, startTime } = req.body;
    const { loggedInUser } = res.locals;
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const updateData = {};
    if (numberOfOfflinePersons) {
      updateData['numberOfOfflinePersons'] = numberOfOfflinePersons;
    }
    if (hostComment) {
      updateData['hostComment'] = hostComment;
    }
    if (price) {
      updateData['price'] = price;
    }
    if (startTime) {
      updateData['startTime'] = formatDate(startTime, config.eventDateFormatParse);
    }
    const {
      script: { id: scriptId },
      shop: { id: shopId }
    } = event;
    const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
    let discountRule = undefined;
    if (applicableDiscountRules.length > 0) {
      discountRule = applicableDiscountRules[0]._id;
    }
    // updateData['discountRule'] = discountRule;
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
    const { userName, source, userId, mobile, wechatId } = req.body;
    const { loggedInUser } = res.locals;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    if (userId && userName) {
      next(new InvalidRequestException('JoinEvent', ['userId', 'userName']));
      return;
    }
    if (source != 'online' && source != 'offline') {
      next(new InvalidRequestException('JoinEvent', ['source']));
      return;
    }
    if (source === 'online' && !userId) {
      next(new InvalidRequestException('JoinEvent', ['source', 'userId']));
      return;
    }
    if (source === 'offline' && !userName) {
      next(new InvalidRequestException('JoinEvent', ['source', 'userName']));
      return;
    }
    if (!wechatId) {
      next(new InvalidRequestException('JoinEvent', ['wechatId']));
      return;
    }
    if (userId != loggedInUser.id) {
      next(new AccessDeinedException(userId, 'You are only join event yourself'));
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
    await this.updateEventParticpantsNumber(event, eventUsers);
    if (!this.canJoinEvent(event, eventUsers)) {
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
          wechatId,
          status: 'unpaid',
          createdAt: new Date()
        },
        opts
      );
      const event = await EventsRepo.findById(eventId);
      // save notifications in db and send sms if necessary
      await MessageService.saveNewJoinEventNotifications(event, newEventUser, opts);

      await session.commitTransaction();
      await EventsRepo.endSession();
      res.json({ code: 'SUCCESS', data: newEventUser });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
  };

  getEventDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      let event = await EventsRepo.findById(eventId);
      if (!event) {
        next(new ResourceNotFoundException('Event', eventId));
        return;
      }
      // get participators for given event
      const eventUsers = await EventUsersRepo.findByEvent(eventId);
      await this.updateEventParticpantsNumber(event, eventUsers);
      event = await EventsRepo.findById(eventId);
      if (!event) {
        next(new ResourceNotFoundException('Event', eventId));
        return;
      }
      const { _id: scriptId } = event.script;
      const { _id: shopId } = event.shop;
      const priceWeeklySchema = await EventsRepo.findPriceWeeklySchemaByEvent(scriptId, shopId);
      const resp = Object.assign(event, { priceWeeklySchema });
      res.json({
        code: 'SUCCESS',
        data: resp
      });
    } catch (err) {
      next(err);
    }
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

    if (userId != loggedInUser.id) {
      next(new AccessDeinedException(userId, 'You can only cancel your own booking'));
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
      next(err);
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
    const { hostUser } = event;
    const { id: hostUserId } = hostUser;
    const { id: loggedInUserId } = loggedInUser;
    if (loggedInUser.id != hostUser.id) {
      next(new AccessDeinedException(loggedInUser._id, 'Only host can update status'));
      return;
    }

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
      next(err);
    }
  };

  getEventDiscountRolesByScriptAndShop = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId } = req.params;
    if (!shopId) {
      next(new ResourceNotFoundException('Shop', shopId));
      return;
    }
    if (!scriptId) {
      next(new ResourceNotFoundException('Script', scriptId));
      return;
    }

    const availableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId);
    // console.log(availableDiscountRules);
    res.json({
      code: 'SUCCESS',
      data: availableDiscountRules
    });
  };

  getAvailableDiscountRules = async (req: Request, res: Response, next: NextFunction) => {
    const { scriptId, shopId } = req.params;
    const { startTime } = req.query;
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

  generateAvailableDiscountRules = async (scriptId: string, shopId: string, startTime: string = undefined) => {
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

  getAvailableDiscountRulesFromDB = async (scriptId: string, shopId: string, startTime: string = undefined) => {
    let result = await DiscountRulesMapRepo.findByShopAndScript(shopId, scriptId, startTime);
    if (result.length === 0) {
      result = await DiscountRulesMapRepo.findByShopAndScript(shopId, undefined, startTime);
    }
    return result;
  };

  cancelEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventsRepo.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { status: currentStatus } = event;
    if (currentStatus === 'complelted') {
      next(new EventCannotCancelException(eventId));
      return;
    }
    const status = 'cancelled';
    const eventToUpdate = Object.assign(event.toObject(), { status });
    const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate);
    res.json({ code: 'SUCCESS', data: newEvent });
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
    if (!this.canCompleteEvent(event, eventUsers)) {
      next(new EventCannotCompleteException(eventId));
      return;
    }
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const eventToUpdate = Object.assign(newEvent, { status });
      newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, opts);
      newEvent = await EventsRepo.findById(eventId);
      const eventCommissions = this.generateEventCommission(newEvent, eventUsers);
      if (eventCommissions) {
        await EventsRepo.saveEventCommissions(eventCommissions, opts);
      }

      await MessageService.saveCompleteEventNotifications(newEvent, opts);

      await session.commitTransaction();
      await EventsRepo.endSession();
      res.json({ code: 'SUCCESS', data: newEvent });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
  };

  generateEventCommission = (event, eventUsers) => {
    const { discountRule, hostUser, price } = event;
    const totalAmount = price * eventUsers.length;
    if (discountRule) {
      const { discount } = discountRule;
      const { host, participator } = discount;
      const hostCommission = {
        user: hostUser,
        amount: (totalAmount * host) / 100
      };
      const participatorCommissions = eventUsers.map(eventUser => {
        const { user } = eventUser;
        return {
          user,
          amount: (price * participator) / 100
        };
      });
      return {
        event,
        commissions: {
          host: hostCommission,
          participators: participatorCommissions
        }
      };
    } else {
      return undefined;
    }
  };

  /**
   * Update event participants stats.
   *
   * @param {[type]} event      [description]
   * @param {[type]} eventUsers [description]
   */
  updateEventParticpantsNumber = async (event, eventUsers) => {
    const { minNumberOfPersons, maxNumberOfPersons, numberOfOfflinePersons } = event;
    let { minNumberOfAvailableSpots, maxNumberOfAvailableSpots, numberOfParticipators } = event;
    if (!minNumberOfAvailableSpots) {
      minNumberOfAvailableSpots = 0;
    }
    if (!maxNumberOfAvailableSpots) {
      maxNumberOfAvailableSpots = 0;
    }
    if (!numberOfParticipators) {
      numberOfParticipators = 0;
    }
    numberOfParticipators = eventUsers.length;
    minNumberOfAvailableSpots = minNumberOfPersons - numberOfParticipators - numberOfOfflinePersons;
    maxNumberOfAvailableSpots = maxNumberOfPersons - numberOfParticipators - numberOfOfflinePersons;
    const eventToUpdate = Object.assign(event, {
      minNumberOfAvailableSpots,
      maxNumberOfAvailableSpots,
      numberOfParticipators,
      numberOfOfflinePersons
    });
    const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, {});
    return newEvent;
  };

  canJoinEvent = (event, eventUsers) => {
    const { numberOfAvailableSpots, numberOfParticipators, numberOfOfflinePersons, minNumberOfPersons, maxNumberOfPersons } = event;
    const numberOfOnlinePersons = eventUsers.length;
    return numberOfOnlinePersons + numberOfOfflinePersons < maxNumberOfPersons;
  };

  canCompleteEvent = (event, eventUsers) => {
    let allPaid = true;
    for (let i = 0; i < eventUsers.length; i++) {
      const eventUser = eventUsers[i];
      const { status } = eventUser;
      if (status === 'unpaid') {
        allPaid = true;
        break;
      }
    }
    const { numberOfAvailableSpots, numberOfParticipators, numberOfOfflinePersons, minNumberOfPersons, maxNumberOfPersons } = event;
    const numberOfOnlinePersons = eventUsers.length;
    return allPaid && numberOfOnlinePersons + numberOfOfflinePersons >= minNumberOfPersons && numberOfOnlinePersons + numberOfOfflinePersons <= maxNumberOfPersons;
  };

  /**
   * Update event status to expired if endTime is past.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const response = await EventsRepo.updateExpiredEvents();
    const { nModified } = response;
    res.json({ code: 'SUCCESS', data: `${nModified} record(s) are updated` });
  };
}
