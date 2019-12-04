import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';

export class AuthRoutes {
  authController: AuthController = new AuthController();

  routes(app): void {
    //
    app.route('/oauth/login').post((req: Request, res: Response, next: NextFunction) => {
      // middleware
      // console.log(`Request from: ${req.originalUrl}`);
      // console.log(`Request type: ${req.method}`);
      next();
    }, this.authController.login);

    app.route('/auth/login').post(this.authController.loginWithUserNameAndPassword);

    app.route('/oauth/code2session').post(this.authController.code2session);
  }
}
