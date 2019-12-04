import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException } from '../exceptions/custom.exceptions';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import EventsRepo from '../repositories/events.repository';
import TagsRepo from '../repositories/tags.repository';
import UserService from '../services/user.service';
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
      if (type === 'event') {
        const event = await EventsRepo.findById(objectId);
        if (!event) {
          throw new ResourceNotFoundException('Event', objectId);
          return;
        }
      }
      const tag = await TagsRepo.findById(tagId);
      if (!tag) {
        throw new ResourceNotFoundException('Tag', tagId);
        return;
      }
      const userTag = await UserService.addUserTag({
        taggedBy: loggedInUserId,
        user: userId,
        tag: tagId,
        type: 'event',
        objectId
      });
      res.json({ code: 'SUCCESS', data: userTag });
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
