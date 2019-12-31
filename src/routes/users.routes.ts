import { Request, Response, NextFunction } from 'express';
import { UsersController } from '../controllers/users.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';
import cacheMiddleware from '../middleware/cache.middleware';
import config from '../config';

export class UsersRoutes {
  usersController: UsersController = new UsersController();

  routes(app): void {
    // Contact
    app.route('/users').get((req: Request, res: Response, next: NextFunction) => {
      // middleware
      console.log(`Request from: ${req.originalUrl}`);
      console.log(`Request type: ${req.method}`);
      if (req.query.key !== '78942ef2c1c98bf10fca09c808d718fa3734703e') {
        res.status(401).send('You shall not pass!');
      } else {
        next();
      }
    }, this.usersController.getUsers);

    app.route('/users/access_token').get(this.usersController.getAccessToken);

    app
      .route('/users/:userId')
      .get(cacheMiddleware(config.cache.duration), this.usersController.getUserDetails)
      .put(verifyToken, permit({ domain: 'user', operations: ['updateUser'] }), this.usersController.updateUser);
    app.route('/users/:userId/block').put(verifyToken, permit({ domain: 'user', operations: ['blockUserById'] }), this.usersController.blockUser);
    app.route('/users/:userId/tag').post(verifyToken, this.usersController.addUserTag);
    app
      .route('/users/:userId/endorse')
      .post(verifyToken, this.usersController.endorseUser)
      .delete(verifyToken, this.usersController.unendorseUser);
    app.route('/profile').get(cacheMiddleware(config.cache.duration), verifyToken, permit({ domain: 'user', operations: ['getProfile'] }), this.usersController.getMyProfile);
    app.route('/profile/my-events').get(cacheMiddleware(config.cache.duration), verifyToken, permit({ domain: 'user', operations: ['getMyEvents'] }), this.usersController.getMyEvents);
    app.route('/profile/token-status').get(verifyToken, this.usersController.getTokenStatus);
    app.route('/profile/wechat-data').post(verifyToken, this.usersController.getWechatEncryptedData);

    app.route('/users/update-tags-endorsements').post(verifyToken, this.usersController.updateTagsAndEndorsements);
  }
}
