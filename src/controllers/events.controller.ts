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
  AccessDeniedException,
  EventCannotCreateException,
  EventCannotUpdateException,
  EventIsFullBookedException,
  EventCannotCompleteException,
  EventCannotCancelException,
  UserIsBlacklistedException
} from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import MessageService from '../services/message.service';
import EventService from '../services/event.service';
import OrderService from '../services/order.service';
import CacheService from '../services/cache.service';
import UserService from '../services/user.service';
import config from '../config';
import { nowDate, string2Date, formatDate, addDays, add } from '../utils/dateUtil';
import { getRandomString, pp } from '../utils/stringUtil';
import { getTopRole } from '../utils/user';
import logger from '../utils/logger';
// import * as _ from 'lodash';

export class EventsController extends BaseController {
  getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let offset = parseInt(req.query.offset);
      let limit = parseInt(req.query.limit);
      const { keyword, filter: filterStr, sort: sortStr } = req.query;
      let filterToUpdate = { status: ['ready'], availableSpots: -1 };
      let sortToUpdate = {};
      if (filterStr) {
        const filter = JSON.parse(decodeURIComponent(filterStr));
        filterToUpdate = Object.assign(filterToUpdate, filter);
        // console.log(filterToUpdate);
      }
      if (sortStr) {
        const sort = JSON.parse(decodeURIComponent(sortStr));
        sortToUpdate = Object.assign(sortToUpdate, sort);
      }
      if (!offset) {
        offset = config.query.offset;
      }
      if (!limit) {
        limit = config.query.limit;
      }
      // console.log(filterToUpdate);
      let result = await EventsRepo.find({ keyword, offset, limit }, filterToUpdate, sortToUpdate);
      const links = this.generateLinks(result.pagination, req.route.path, '');
      result = Object.assign({}, result, links);
      res.json(result);
    } catch (err) {
      next(err);
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
      let statusArr = ['ready', 'completed', 'expired'];
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

  /**
   * Get number of events by given date in which the whole month it falls. date format: YYYY-MM
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  getEventsCountByDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date: dateStr } = req.params;
      const { status } = req.query;
      let statusArr = ['ready', 'completed', 'expired'];
      if (status) {
        statusArr = status.split(',');
      }
      const date = string2Date(dateStr, false, 'YYYY-MM');
      const from = date
        .clone()
        .startOf('month')
        .utc();
      const to = date
        .clone()
        .endOf('month')
        .utc();
      // const dateArr = [date.clone().day(-1), date.clone().day(0), date.clone().day(1), date.clone().day(2), date.clone().day(3), date.clone().day(4), date.clone().day(5)];
      console.log(`Find event count from ${from} to ${to}...`);
      const result = await EventsRepo.findEventsCountByDates(from, to, {
        status: statusArr
      });
      res.json({ code: 'SUCCESS', data: result });
    } catch (err) {
      console.error(err);
      res.send(err);
    }
  };

  addEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { shopId, scriptId, startTime, endTime, hostUserId, hostComment, numberOfPersons, price, hostUserMobile, hostUserWechatId } = req.body;
    let { numberOfOfflinePersons, isHostJoin, supportPayment } = req.body;
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
    // console.log(typeof isHostJoin !== 'undefined');
    if (typeof isHostJoin === 'undefined') {
      isHostJoin = true;
    }
    // if (!isHostJoin) {
    //   isHostJoin = true;
    // }
    const { loggedInUser } = res.locals;
    const minNumberOfAvailableSpots = minNumberOfPersons - numberOfOfflinePersons;
    const maxNumberOfAvailableSpots = maxNumberOfPersons - numberOfOfflinePersons;
    const numberOfParticipators = 0;
    let newEvent;
    let newOrder;
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const { duration } = script;

      const dtStartTime = formatDate(startTime, config.eventDateFormatParse);
      const dtEndTime = add(startTime, duration, 'm');

      const opts = { session };
      // update host user mobile and wechat if user does not have mobile
      const userToUpdate = Object.assign(hostUser, {
        mobile: hostUserMobile,
        wechatId: hostUserWechatId
      });
      await UsersRepo.saveOrUpdateUser(userToUpdate, opts);

      const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
      let discountRule = undefined;
      if (applicableDiscountRules.length > 0) {
        if (applicableDiscountRules.length > 1) {
          next(new EventCannotCreateException([shopId, scriptId, startTime, hostUserId]));
          return;
        }
        discountRule = applicableDiscountRules[0];
      }
      if (typeof supportPayment === 'undefined') {
        supportPayment = EventService.isPaymentSupported(shop);
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
          status: 'ready',
          supportPayment,
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
        if (supportPayment) {
          const order = {
            createdBy: hostUserId,
            type: 'event_join',
            amount: (price * 100).toFixed(),
            objectId: newEventUser.id,
            outTradeNo: getRandomString(32),
            orderStatus: 'created'
          };
          newOrder = await OrderService.createOrder(order, opts);
        }
      }
      newEvent = Object.assign(newEvent.toObject(), {
        shop,
        script,
        hostUser: loggedInUser
      });
      // logger.info(`Added event ${pp(newEvent)}`);
      // console.log(newEvent);
      // save notifications in db and send sms if necessary
      await MessageService.saveNewEventNotifications(newEvent, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(newEvent, req);
      // get participators for given event
      const eventUsers = await EventUsersRepo.findByEvent(newEvent.id);
      newEvent = await this.updateEventParticpantsNumber(newEvent, eventUsers);
      res.json({
        code: 'SUCCESS',
        data: Object.assign(newEvent.toObject(), { order: newOrder })
      });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
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
    const { numberOfOfflinePersons, hostComment, price, startTime } = req.body;
    const { loggedInUser } = res.locals;
    const { eventId } = req.params;
    const event = await EventService.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const {
      script: { id: scriptId },
      shop: { id: shopId },
      price: originalPrice
    } = event;
    const script = await ScriptsRepo.findById(scriptId);

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
      const { duration } = script;
      const endTime = add(startTime, duration, 'm');
      if (endTime) {
        updateData['endTime'] = endTime;
      }
      const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
      // console.log(applicableDiscountRules);
      let discountRule = undefined;
      if (applicableDiscountRules.length > 0) {
        if (applicableDiscountRules.length > 1) {
          next(new EventCannotUpdateException(eventId));
          return;
        }
        discountRule = applicableDiscountRules[0]._id;
      }
      updateData['discountRule'] = discountRule;
    }

    // console.log(event.discountRule);
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      updateData['updatedAt'] = new Date();
      const eventToUpdate = Object.assign(event.toObject(), updateData);
      logger.info(`Update event ${pp(eventToUpdate)}`);
      // console.log(eventToUpdate.discountRule);
      const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, opts);
      // if price has changed, refund all paid players
      if (price && originalPrice != price) {
        logger.info(`Detecting price is changed, cancel all paid bookings, event: ${eventId}`);
        await EventService.cancelBookings(event, 'price_updated', '退款 - 价格改变', true, opts);
      }
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(newEvent, req);
      res.json({ code: 'SUCCESS', data: newEvent });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
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
    const event = await EventService.findById(eventId);
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
      next(new AccessDeniedException(userId, 'You are only join event yourself'));
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
    let eventUsers = await EventUsersRepo.findByEvent(eventId, {
      status: ['paid', 'unpaid']
    });
    await this.updateEventParticpantsNumber(event, eventUsers);
    const existingEventUsers = eventUsers.filter(_ => {
      const {
        user: { _id: eventUserId }
      } = _;
      return userId === eventUserId.toString();
    });
    // console.log(existingEventUser);
    // if there is an entry already, return existing booking
    if (existingEventUsers && existingEventUsers.length > 0) {
      logger.info(`Found existing booking for user ${userId}`);
      const existingEventUser = existingEventUsers[0];
      // const { _id } = existingEventUser;
      // let order = await OrderService.findByObjectId(_id, 'created');
      const order = await this.createOrder(userId, event, existingEventUser, {});

      // console.log(order);
      // console.log(Object.assign(existingEventUser, { order: order }));
      res.json({
        code: 'SUCCESS',
        data: Object.assign(existingEventUser.toObject(), {
          order: order.toObject()
        })
      });
      return;
    }
    if (!this.canJoinEvent(event, eventUsers)) {
      next(new EventIsFullBookedException(eventId));
      return;
    }
    eventUsers = await EventUsersRepo.findByEvent(eventId, {
      status: ['paid', 'unpaid', 'blacklisted']
    });
    if (this.isBlacklistedUser(userId, eventUsers)) {
      next(new UserIsBlacklistedException(eventId, userId));
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
      const user = await UsersRepo.findById(userId);
      const userToUpdate = Object.assign(user, {
        wechatId
      });
      await UsersRepo.saveOrUpdateUser(user);
      const event = await EventService.findById(eventId);
      const newOrder = await this.createOrder(userId, event, newEventUser, opts);
      // save notifications in db and send sms if necessary
      await MessageService.saveNewJoinEventNotifications(event, newEventUser, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(event, req);
      res.json({
        code: 'SUCCESS',
        data: Object.assign(newEventUser.toObject(), { order: newOrder })
      });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
  };

  createOrder = async (userId, event, eventUser, opts) => {
    const { price, supportPayment } = event;
    let newOrder;
    if (supportPayment) {
      const order = {
        createdBy: userId,
        type: 'event_join',
        objectId: eventUser.id,
        amount: (price * 100).toFixed(),
        outTradeNo: getRandomString(32),
        status: 'created'
      };
      newOrder = await OrderService.createOrder(order, opts);
    }
    return newOrder;
  };

  getEventDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      let event = await EventService.findById(eventId);
      if (!event) {
        next(new ResourceNotFoundException('Event', eventId));
        return;
      }
      // get participators for given event
      const eventUsers = await EventUsersRepo.findByEvent(eventId);
      await this.updateEventParticpantsNumber(event, eventUsers);
      event = await EventService.findById(eventId);
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

  getEventDetailsSimplified = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId } = req.params;
      let event = await EventsRepo.findByIdSimplified(eventId);
      if (!event) {
        next(new ResourceNotFoundException('Event', eventId));
        return;
      }
      // get participators for given event
      const eventUsers = await EventUsersRepo.findByEvent(eventId);
      await this.updateEventParticpantsNumber(event, eventUsers);
      event = await EventsRepo.findByIdSimplified(eventId);

      res.json({
        code: 'SUCCESS',
        data: event
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
    const event = await EventService.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const {
      hostUser: { id: hostUserId },
      supportPayment
    } = event;
    const { loggedInUser } = res.locals;
    const { userId, status } = req.body;
    try {
      if (status != 'cancelled' && status != 'blacklisted') {
        next(new InvalidRequestException('EventUser', ['status']));
        return;
      }

      if (status === 'cancelled') {
        if (loggedInUser.id != hostUserId && loggedInUser.id != userId) {
          next(new AccessDeniedException(loggedInUser.id, 'You are not a host or you are trying to cancel others booking'));
          return;
        }
      }

      if (status === 'blacklisted' && hostUserId != loggedInUser.id) {
        next(new AccessDeniedException(loggedInUser.id, 'Only host can blacklist user'));
        return;
      }
    } catch (err) {
      next(err);
    }

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const eventUser = await EventUsersRepo.findEventUser(eventId, userId);
      // console.log(eventUser);
      if (supportPayment) {
        await EventService.cancelBooking(eventUser, '退款 - 参团人取消', true, opts);
      }
      const eventUserToUpdate = Object.assign(eventUser, {
        status: status,
        statusNote: 'user_event_cancelled'
      });
      console.log(eventUserToUpdate);
      const newEventUser = await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(event, req);
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
    const event = await EventService.findById(eventId);
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
    // 	next(new AccessDeniedException(''));
    // }
    const { hostUser } = event;
    const { id: hostUserId } = hostUser;
    const { id: loggedInUserId } = loggedInUser;
    if (loggedInUser.id != hostUser.id) {
      next(new AccessDeniedException(loggedInUser._id, 'Only host can update status'));
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

  // updateEventUser = async (req: Request, res: Response, next: NextFunction) => {
  //   const { eventId } = req.params;
  //   const event = await EventService.findById(eventId);
  //   if (!event) {
  //     next(new ResourceNotFoundException('Event', eventId));
  //     return;
  //   }
  //   const { loggedInUser } = res.locals;
  //   const { userId, numberOfLikes } = req.body;
  //   const {
  //     hostUser: { id: hostUserId }
  //   } = event;
  //   const { id: loggedInUserId } = loggedInUser;

  //   if (typeof numberOfLikes === 'undefined') {
  //     next(new InvalidRequestException('EventUser', ['numberOfLikes']));
  //     return;
  //   }

  //   const eventUser = await EventUsersRepo.findEventUser(eventId, userId);
  //   if (!eventUser) {
  //     next(new AccessDeniedException(loggedInUserId, 'Cannot update user booking'));
  //     return;
  //   }
  //   const session = await EventsRepo.getSession();
  //   session.startTransaction();
  //   try {
  //     const opts = { session };
  //     const eventUserToUpdate = Object.assign(eventUser, { numberOfLikes });
  //     const newEventUser = await EventUsersRepo.saveOrUpdate(eventUserToUpdate, opts);

  //     await session.commitTransaction();
  //     await EventsRepo.endSession();
  //     res.json({ code: 'SUCCESS', data: newEventUser });
  //   } catch (err) {
  //     await session.abortTransaction();
  //     await EventsRepo.endSession();
  //     next(err);
  //   }
  // };

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
    logger.info(`Found available discountRules, ${availableDiscountRules}, for script ${scriptId}, shopId ${shopId}, startTime ${startTime}`);
    return availableDiscountRules;
  };

  getAvailableDiscountRulesFromDB = async (scriptId: string, shopId: string, startTime: string = undefined) => {
    let result = await DiscountRulesMapRepo.findByShopAndScript(shopId, scriptId, startTime);
    if (result.length === 0) {
      result = await DiscountRulesMapRepo.findByShopAndScript(shopId, undefined, startTime);
    }
    return result;
  };

  /**
   * Only host can cancel event.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  cancelEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventService.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { status: currentStatus } = event;
    if (currentStatus === 'complelted') {
      next(new EventCannotCancelException(eventId));
      return;
    }

    const { loggedInUser } = res.locals;
    const { hostUser, supportPayment } = event;
    const { id: hostUserId } = hostUser;
    const { id: loggedInUserId } = loggedInUser;
    if (loggedInUser.id != hostUser.id) {
      next(new AccessDeniedException(loggedInUser._id, 'Only host can cancel event'));
      return;
    }
    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const status = 'cancelled';
      const eventToUpdate = Object.assign(event.toObject(), { status });
      const newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, opts);
      if (supportPayment) {
        logger.info(`Event is payment enabled, cancel all paid bookings if exists`);
        await EventService.cancelBookings(event, 'event_cancelled', '退款 - 参团人取消', true, opts);
      }
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(newEvent, req);
      res.json({ code: 'SUCCESS', data: newEvent });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
  };

  /**
   * Only host can complete event.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  completeEvent = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const event = await EventService.findById(eventId);
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    const { status } = req.body;
    const { loggedInUser } = res.locals;

    const {
      hostUser,
      supportPayment,
      script: { _id: scriptId },
      shop: { _id: shopId },
      startTime,
      discountRule: originalDiscountRule
    } = event;
    const { id: hostUserId } = hostUser;
    const { id: loggedInUserId, roles } = loggedInUser;
    const topRole = getTopRole(roles);
    if (topRole !== 'admin' && loggedInUser.id != hostUser.id) {
      next(new AccessDeniedException(loggedInUser._id, 'Only host or admin can complete event'));
      return;
    }

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

    const applicableDiscountRules = await this.generateAvailableDiscountRules(scriptId, shopId, startTime);
    // if more than one discount found or the found discountRule is not same as the one one in db, it's an error!
    let discountRule = undefined;
    if (applicableDiscountRules.length > 0) {
      if (applicableDiscountRules.length > 1) {
        logger.error(`More than one discountRules found`);
        next(new EventCannotCompleteException(eventId));
        return;
      }
      discountRule = applicableDiscountRules[0]._id;
    }
    if (!this.isSameDiscountRule(originalDiscountRule, discountRule)) {
      logger.error(`Different discount rule found`);
      next(new EventCannotCompleteException(eventId));
      return;
    }

    const session = await EventsRepo.getSession();
    session.startTransaction();
    try {
      const opts = { session };
      const eventToUpdate = Object.assign(newEvent, { status });
      newEvent = await EventsRepo.saveOrUpdate(eventToUpdate, opts);
      newEvent = await EventService.findById(eventId);
      const eventCommissions = this.generateEventCommission(newEvent, eventUsers);
      // console.log(eventCommissions);
      if (eventCommissions) {
        await EventsRepo.saveEventCommissions(eventCommissions, opts);
        if (supportPayment) {
          logger.info(`Event is payment enabled, creating commission refunds if exists`);
          const refunds = await OrderService.createCommissionRefunds(eventCommissions, opts);
          logger.info(`Created ${refunds.length} commission refunds`);
        }
      }
      await MessageService.saveCompleteEventNotifications(newEvent, eventCommissions, opts);
      // await UserService.saveUserPoints(newEvent, eventUsers, opts);
      await session.commitTransaction();
      await EventsRepo.endSession();
      await CacheService.purgeEventCache(newEvent, req);
      res.json({ code: 'SUCCESS', data: newEvent });
    } catch (err) {
      await session.abortTransaction();
      await EventsRepo.endSession();
      next(err);
    }
  };

  isSameDiscountRule(discountRule1, discountRule2) {
    if (!discountRule1 && !discountRule2) {
      return true;
    }
    if ((!discountRule1 && discountRule2) || (discountRule1 && !discountRule2)) {
      return false;
    }
    const { _id: ruleId1 } = discountRule1;
    const { _id: ruleId2 } = discountRule2;
    return ruleId1.toString() === ruleId2.toString();
  }

  generateEventCommission = (event, eventUsers) => {
    const { discountRule, hostUser, price } = event;
    const totalAmount = price * eventUsers.length;
    // console.log(discountRule);
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
    if (minNumberOfAvailableSpots < 0) {
      minNumberOfAvailableSpots = 0;
    }
    maxNumberOfAvailableSpots = maxNumberOfPersons - numberOfParticipators - numberOfOfflinePersons;
    if (maxNumberOfAvailableSpots < 0) {
      maxNumberOfAvailableSpots = 0;
    }
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

  isBlacklistedUser = (userId, eventUsers) => {
    let blacklisted = false;
    for (let i = 0; i < eventUsers.length; i++) {
      const eventUser = eventUsers[i];
      const {
        status,
        user: { id: existingUserId }
      } = eventUser;
      // console.log(userId + ', ' + existingUserId + ', ' + status);
      if (status === 'blacklisted' && existingUserId === userId) {
        blacklisted = true;
        break;
      }
    }
    return blacklisted;
  };

  canCompleteEvent = (event, eventUsers) => {
    let allPaid = true;
    for (let i = 0; i < eventUsers.length; i++) {
      const eventUser = eventUsers[i];
      const { status } = eventUser;
      if (status === 'unpaid') {
        allPaid = false;
        break;
      }
    }
    // console.log(allPaid);
    const { numberOfAvailableSpots, numberOfParticipators, numberOfOfflinePersons, minNumberOfPersons, maxNumberOfPersons } = event;
    const numberOfOnlinePersons = eventUsers.length;
    console.log(allPaid + ', ' + numberOfOnlinePersons + ', ' + numberOfOfflinePersons + ', ' + minNumberOfPersons + ', ' + maxNumberOfPersons);
    return allPaid && numberOfOnlinePersons + numberOfOfflinePersons >= minNumberOfPersons && numberOfOnlinePersons + numberOfOfflinePersons <= maxNumberOfPersons;
  };

  // /**
  //  * Update event status to expired if endTime is past.
  //  *
  //  * @param {Request}      req  [description]
  //  * @param {Response}     res  [description]
  //  * @param {NextFunction} next [description]
  //  */
  // updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  //   const { loggedInUser } = res.locals;
  //   const response = await EventsRepo.updateExpiredEvents();
  //   const { nModified } = response;
  //   res.json({ code: 'SUCCESS', data: `${nModified} record(s) are updated` });
  // };

  /**
   * Archive events which startTime is past and not full.
   *
   * @param {Request}      req  [description]
   * @param {Response}     res  [description]
   * @param {NextFunction} next [description]
   */
  archiveEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await EventService.archiveEvents();
      // console.log(response);
      const { eventIds, affectedRows } = response;
      logger.info(`${affectedRows} record(s) has been updated, data: ${eventIds}`);
      res.json({
        code: 'SUCCESS',
        data: `${affectedRows} record(s) has been updated`
      });
    } catch (err) {
      next(err);
    }
  };

  getEventQrCode = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    try {
      const response = await EventService.getQrCode(eventId);
      // console.log(response);
      res.json({ code: 'SUCCESS', data: response });
    } catch (err) {
      next(err);
    }
  };

  getEventOrders = async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const { loggedInUser } = res.locals;
    const event = await EventService.findById(eventId, {
      status: ['ready', 'completed', 'expired', 'cancelled']
    });
    if (!event) {
      next(new ResourceNotFoundException('Event', eventId));
      return;
    }
    try {
      const orders = await OrderService.getOrderByEvent(event);

      res.json({ code: 'SUCCESS', data: orders });
    } catch (err) {
      next(err);
    }
  };
}
