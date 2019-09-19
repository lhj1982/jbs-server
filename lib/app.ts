import * as express from 'express';
import * as bodyParser from 'body-parser';
import { UsersRoutes } from './routes/users.routes';
import { ShopsRoutes } from './routes/shops.routes';
import { ScriptsRoutes } from './routes/scripts.routes';
import { AuthRoutes } from './routes/auth.routes';
import errorMiddleware from './middleware/error.middleare';
import * as mongoose from 'mongoose';
const config = require('./config');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

class App {
  app: express.Application = express();
  usersRoutes: UsersRoutes = new UsersRoutes();
  authRoutes: AuthRoutes = new AuthRoutes();
  shopsRoutes: ShopsRoutes = new ShopsRoutes();
  scriptsRoutes: ScriptsRoutes = new ScriptsRoutes();
  // mongoUrl: string = 'mongodb://localhost/CRMdb';
  mongoUrl: string = config.dbUri;

  // cors - must be before app use routes
  constructor() {
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.config();
    this.mongoSetup();
    this.usersRoutes.routes(this.app);
    this.authRoutes.routes(this.app);
    this.shopsRoutes.routes(this.app);
    this.scriptsRoutes.routes(this.app);
    this.app.use(errorMiddleware);
  }

  allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', `http://localhost:${config.port}`);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Credentials');
    res.header('Access-Control-Allow-Credentials', 'true');
    //intercepts OPTIONS method
    if ('OPTIONS' === req.method) {
      //respond with 200
      res.send(200);
    } else {
      //move on
      next();
    }
  }

  config(): void {
    this.app.use(this.allowCrossDomain);
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // serving static files
    this.app.use(express.static('public'));
  }

  mongoSetup(): void {
    mongoose.Promise = global.Promise;
    mongoose.connect(this.mongoUrl, { useNewUrlParser: true });
  }
}

export default new App().app;
