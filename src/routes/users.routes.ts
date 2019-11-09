import { Request, Response, NextFunction } from 'express';
import { UsersController } from '../controllers/users.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

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
      .get(this.usersController.getUserDetails)
      .put(verifyToken, permit({ domain: 'user', operations: ['update'] }), this.usersController.updateUser);
    app.route('/users/:userId/block').put(verifyToken, permit({ domain: 'user', operations: ['block'] }), this.usersController.blockUser);

    app.route('/profile').get(verifyToken, permit({ domain: 'user', operations: ['read'] }), this.usersController.getMyProfile);
    app.route('/profile/my-events').get(verifyToken, permit({ domain: 'user', operations: ['read'] }), this.usersController.getMyEvents);
    app.route('/profile/token-status').get(verifyToken, this.usersController.getTokenStatus);
  }
}
