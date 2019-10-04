import { Request, Response, NextFunction } from 'express';
import { EventsController } from '../controllers/events.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class EventsRoutes {
  eventsController: EventsController = new EventsController();

  routes(app): void {
    app.route('/events/available-discount-rules').get(verifyToken, this.eventsController.getAvailableDiscountRules);

    app
      .route('/events')
      .get((req: Request, res: Response, next: NextFunction) => {
        // middleware
        console.log(`Request from: ${req.originalUrl}`);
        console.log(`Request type: ${req.method}`);
        next();
      }, this.eventsController.getEvents)
      .post(verifyToken, permit({ domain: 'event', operations: ['update'] }), this.eventsController.addEvent);

    app.route('/events/:scriptId/:shopId').get(this.eventsController.getEventsByScriptAndShop);
    app.route('/events/price-schema').get(this.eventsController.getPriceWeeklySchema);
    app.route('/events/discount-rules').get(verifyToken, this.eventsController.getDiscountRules);

    app
      .route('/events/:eventId')
      .get(verifyToken, this.eventsController.getEventDetails)
      .put(verifyToken, permit({ domain: 'event', operations: ['write'] }), this.eventsController.updateEvent);
    app.route('/events/calendar/:date').get(this.eventsController.getEventsByDate);
    app.route('/events/:eventId/join').post(verifyToken, permit({ domain: 'event-user', operations: ['create'] }), this.eventsController.joinUserEvent);
    app.route('/events/:eventId/users/cancel').put(verifyToken, permit({ domain: 'event-user', operations: ['update'] }), this.eventsController.cancelEventUser);
    app.route('/events/:eventId/users/update-status').put(verifyToken, permit({ domain: 'event-user', operations: ['delete'] }), this.eventsController.updateEventUserStatus);
  }
}
