import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException } from '../exceptions/custom.exceptions';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import EventsRepo from '../repositories/events.repository';
import TagsRepo from '../repositories/tags.repository';
import UserService from '../services/user.service';
import CacheService from '../services/cache.service';
import * as _ from 'lodash';

export class UsersController {
  getUsers = async (req: Request, res: Response) => {
    try {
      const contact = await UsersRepo.find({});
      res.json(contact);
    } catch (err) {
      res.send(err);
    }
  };

  sendInvitation = (req: Request, res: Response) => {
    const { openId } = req.body;
  };

  getAccessToken = async (req: Request, res: Response) => {
    const response = await AuthApi.getAccessToken();
    // UserRepo.saveAccessToken();
    res.json(response);
    // return response;
  };

  getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { loggedInUser } = res.locals;
    if (userId && userId != loggedInUser.id) {
      next(new AccessDeinedException(userId, 'You can only show your own profile'));
    }
    res.json({ code: 'SUCCESS', data: loggedInUser });
  };

  getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { status } = req.query;
    // default status filter
    let statusArr = ['ready', 'completed', 'expired'];
    if (status) {
      statusArr = status.split(',');
    }
    const user = await UsersRepo.findById(userId);
    if (!user) {
      next(new ResourceNotFoundException('User', userId));
      return;
    }
    const events = await EventsRepo.findEventsByUser(userId, {
      status: statusArr
    });
    const response = Object.assign(user.toObject(), { events });
    res.json({ code: 'SUCCESS', data: response });
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    try {
      const user = await UsersRepo.findById(userId);
      if (!user) {
        next(new ResourceNotFoundException('User', userId));
        return;
      }
      const { nickName, gender, description, city, email, mobile, wechatId, company, avatarImage, ageTag } = req.body;
      const userToUpdate = Object.assign(user, {
        nickName,
        gender,
        city,
        description,
        email,
        mobile,
        wechatId,
        company,
        avatarImage,
        ageTag
      });
      const updatedUser = await UsersRepo.saveOrUpdateUser(user);
      await CacheService.purgeUserCache(user, req);
      res.json({ code: 'SUCCESS', data: updatedUser });
    } catch (err) {
      res.send(err);
    }
  };

  getMyEvents = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    if (!loggedInUser) {
      next(new AccessDeinedException(''));
      return;
    }
    const { status } = req.query;
    // default status filter
    let statusArr = ['ready', 'completed', 'expired'];
    if (status) {
      statusArr = status.split(',');
    }
    const events = await EventsRepo.findEventsByUser(loggedInUser._id, {
      status: statusArr
    });
    res.json({ code: 'SUCCESS', data: events });
  };

  getTokenStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { tokenIssuedAt, tokenExpiredAt, loggedInUser } = res.locals;
    res.json({
      code: 'SUCCESSS',
      data: {
        tokenIssuedAt,
        tokenExpiredAt,
        userId: loggedInUser.id,
        openId: loggedInUser.openId
      }
    });
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    if (!loggedInUser) {
      next(new AccessDeinedException(''));
      return;
    }
    try {
      const { userId } = req.params;
      const user = await UsersRepo.findById(userId);
      if (!user) {
        next(new ResourceNotFoundException('User', userId));
        return;
      }
      const userToUpdate = Object.assign(user.toObject(), {
        status: 'blocked'
      });
      const newUser = await UsersRepo.saveOrUpdateUser(userToUpdate);
      res.json({ code: 'SUCCESS', data: newUser });
    } catch (err) {
      next(err);
    }
  };

  getWechatEncryptedData = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    if (!loggedInUser) {
      next(new AccessDeinedException(''));
      return;
    }
    const { body } = req;
    try {
      // console.log(body);
      const response = await UserService.getWechatEncryptedData(body);
      res.json({ code: 'SUCCESS', data: response });
    } catch (err) {
      next(err);
    }
  };

  addUserTag = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { userId } = req.params;
    const {
      body: { tagId, type, objectId }
    } = req;
    try {
      const { _id: loggedInUserId } = loggedInUser;
      if (userId === loggedInUserId.toString()) {
        next(new AccessDeinedException(loggedInUserId, 'You are not allowed to tag yourself'));
        return;
      }
      const eventUser = undefined;
      if (type === 'event_user') {
        const eventUser = await EventUsersRepo.findById(objectId);
        if (!eventUser) {
          next(new ResourceNotFoundException('EventUser', objectId));
          return;
        }
        const { event: eventId, user: userIdToTag } = eventUser;
        const event = await EventsRepo.findById(eventId);
        if (!event) {
          next(new ResourceNotFoundException('Event', eventId));
          return;
        }

        if (userIdToTag != userId) {
          next(new AccessDeinedException(loggedInUserId, 'Cannot add tag'));
          return;
        }

        const tag = await TagsRepo.findById(tagId);
        if (!tag) {
          next(new ResourceNotFoundException('Tag', tagId));
          return;
        }
        const userTag = await UserService.addUserTag(
          {
            taggedBy: loggedInUserId,
            user: userId,
            tag: tagId,
            type: 'event_user',
            objectId
          },
          eventUser
        );
        res.json({ code: 'SUCCESS', data: userTag });
      } else {
        next(new InvalidRequestException('User', ['type']));
        return;
      }
    } catch (err) {
      next(err);
    }
  };

  endorseUser = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { userId } = req.params;
    const {
      body: { type, objectId }
    } = req;
    try {
      const { id: loggedInUserId } = loggedInUser;
      if (userId === loggedInUserId) {
        next(new AccessDeinedException(loggedInUserId, 'You are not allowed to endorse yourself'));
        return;
      }
      const eventUser = undefined;
      if (type === 'event_user') {
        const eventUser = await EventUsersRepo.findById(objectId);
        if (!eventUser) {
          next(new ResourceNotFoundException('EventUser', objectId));
          return;
        }
        const { event: eventId, user: userIdToEndorse } = eventUser;
        const event = await EventsRepo.findById(eventId);
        if (!event) {
          next(new ResourceNotFoundException('Event', eventId));
          return;
        }
        const eventUsers = await EventUsersRepo.findByEvent(eventId);
        const loggedInUserInEvent = eventUsers.filter(_ => {
          const {
            user: { _id: userId }
          } = _;
          return userId.toString() === loggedInUserId;
        });
        // console.log(loggedInUserInEvent);
        if (!loggedInUserInEvent || loggedInUserInEvent.length === 0) {
          next(new AccessDeinedException(loggedInUserId, 'You have to join event to be able to endorse others'));
          return;
        }
        if (userIdToEndorse.toString() != userId) {
          next(new AccessDeinedException(loggedInUserId, 'The person you endorse has to join the event first'));
          return;
        }
        const userEndorsement = await UserService.endorseUser(
          {
            endorsedBy: loggedInUserId,
            user: userId,
            type: 'event_user',
            objectId
          },
          eventUser
        );
        res.json({ code: 'SUCCESS', data: userEndorsement });
      } else {
        next(new InvalidRequestException('User', ['type']));
        return;
      }
    } catch (err) {
      next(err);
    }
  };

  updateTagsAndEndorsements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.updateTagsAndEndorsements();
      res.json({ code: 'SUCCESS', data: result });
    } catch (err) {
      next(err);
    }
  };

  // getUserEvents = async (req: Request, res: Response, next: NextFunction) => {
  //   const { loggedInUser } = res.locals;
  //   if (!loggedInUser) {
  //     next(new AccessDeinedException(''));
  //   }
  //   const eventUsers = await UsersRepo.getUserEvents(loggedInUser._id);
  //   res.json({ code: 'SUCCESS', data: eventUsers });
  // };
}
