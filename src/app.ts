import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as xmlparser from 'express-xml-bodyparser';
import * as mongoose from 'mongoose';
import config from './config';
import { RoleSchema } from './models/role.model';
import { ShopSchema } from './models/shop.model';
import { ScriptSchema } from './models/script.model';
import { DiscountRuleSchema } from './models/discountRule.model';
import { UserSchema } from './models/user.model';
import { EventSchema } from './models/event.model';
import { EventUserSchema } from './models/eventUser.model';
import { EventCommissionSchema } from './models/eventCommissions.model';
import { NotificationSchema } from './models/notification.model';
import { OrderSchema } from './models/order.model';
import { RefundSchema } from './models/refund.model';
import { TagSchema } from './models/tag.model';
import { UserTagSchema } from './models/userTag.model';
import { LeadingBoardSchema } from './models/leadingBoard.model';

const Role = mongoose.model('Role', RoleSchema, 'roles');
const Event = mongoose.model('Event', EventSchema, 'events');
const User = mongoose.model('User', UserSchema, 'users');
const EventUser = mongoose.model('EventUser', EventUserSchema, 'eventUsers');
const Shop = mongoose.model('Shop', ShopSchema, 'shops');
const Script = mongoose.model('Script', ScriptSchema, 'scripts');
const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema, 'discountRules');
const EventCommission = mongoose.model('EventCommission', EventCommissionSchema, 'eventCommissions');
const Notification = mongoose.model('Notification', NotificationSchema, 'notifications');
const Refund = mongoose.model('Refund', RefundSchema, 'refunds');
const Order = mongoose.model('Order', OrderSchema, 'orders');
const Tag = mongoose.model('Tag', TagSchema, 'tags');
const UserTag = mongoose.model('UserTag', UserTagSchema, 'userTags');
const LeadingBoard = mongoose.model('LeadingBoard', LeadingBoardSchema, 'leadingBoard');

import { UsersRoutes } from './routes/users.routes';
import { ShopsRoutes } from './routes/shops.routes';
import { ScriptsRoutes } from './routes/scripts.routes';
import { AuthRoutes } from './routes/auth.routes';
import { EventsRoutes } from './routes/events.routes';
import { PricesRoutes } from './routes/prices.routes';
import { NotificationsRoutes } from './routes/notifications.routes';
import { OrdersRoutes } from './routes/orders.routes';
import { LeadingBoardRoutes } from './routes/leadingBoard.routes';
import errorMiddleware from './middleware/error.middleare';
const compression = require('compression');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(__dirname + '/config/swagger.yaml');
import logger from './utils/logger';
logger.info('Hello world');
// const swaggerDocument = require('./config/swagger.json');

class App {
  app: express.Application = express();
  usersRoutes: UsersRoutes = new UsersRoutes();
  authRoutes: AuthRoutes = new AuthRoutes();
  shopsRoutes: ShopsRoutes = new ShopsRoutes();
  scriptsRoutes: ScriptsRoutes = new ScriptsRoutes();
  eventsRoutes: EventsRoutes = new EventsRoutes();
  pricesRoutes: PricesRoutes = new PricesRoutes();
  notificationsRoutes: NotificationsRoutes = new NotificationsRoutes();
  ordersRoutes: OrdersRoutes = new OrdersRoutes();
  leadingBoardRoutes: LeadingBoardRoutes = new LeadingBoardRoutes();
  // mongoUrl: string = 'mongodb://localhost/CRMdb';
  mongoUrl: string = config.dbUri;

  // cors - must be before app use routes
  constructor() {
    // console.log(this.mongoUrl);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.config();
    this.mongoSetup();
    this.usersRoutes.routes(this.app);
    this.authRoutes.routes(this.app);
    this.shopsRoutes.routes(this.app);
    this.scriptsRoutes.routes(this.app);
    this.eventsRoutes.routes(this.app);
    this.pricesRoutes.routes(this.app);
    this.notificationsRoutes.routes(this.app);
    this.ordersRoutes.routes(this.app);
    this.leadingBoardRoutes.routes(this.app);
    this.app.use(errorMiddleware);
  }

  allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
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
    this.app.use(xmlparser());
    this.app.use((req, res, next) => {
      logger.info(`Request from: ${req.originalUrl}`);
      logger.info(`Request type: ${req.method}`);
      next();
    });
    this.app.get('/', function(req, res) {
      res.send('boogoogoo api v1.0');
    });
    // serving static files
    this.app.use(express.static('public'));
    this.app.use(compression());
  }

  mongoSetup(): void {
    mongoose.Promise = global.Promise;
    mongoose.connect(this.mongoUrl, {
      useNewUrlParser: true,
      replicaSet: 'rs0'
    });
  }
}

export default new App().app;
