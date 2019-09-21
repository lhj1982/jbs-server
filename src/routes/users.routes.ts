import { Request, Response, NextFunction } from 'express';
import { UsersController } from '../controllers/users.controller';

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
  }
}
