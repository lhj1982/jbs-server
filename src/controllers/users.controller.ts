import { Request, Response, NextFunction } from 'express';
import AuthApi from '../api/auth';
import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException, AccessDeinedException } from '../exceptions/custom.exceptions';
import UsersRepo from '../repositories/users.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';

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

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    res.json({ code: 'SUCCESS', data: {} });
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    try {
      const user = await UsersRepo.findById(userId);
      if (!user) {
        next(new ResourceNotFoundException('User', userId));
        return;
      }
      const { description, email, mobile, wechatId, company, avatarImage } = req.body;
      const userToUpdate = Object.assign(user, {
        description,
        email,
        mobile,
        wechatId,
        company,
        avatarImage
      });
      const updatedUser = await UsersRepo.saveOrUpdateUser(user);
      res.json({ code: 'SUCCESS', data: updatedUser });
    } catch (err) {
      res.send(err);
    }
  };

  getUserEvents = async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = res.locals.loggedInUser;
    if (!loggedInUser) {
      next(new AccessDeinedException(''));
    }
    const eventUsers = await UsersRepo.getUserEvents(loggedInUser._id);
    res.json({ code: 'SUCCESS', data: eventUsers });
  };
}
