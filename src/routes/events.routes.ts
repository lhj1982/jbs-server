import { Request, Response, NextFunction } from 'express';
import { EventsController } from '../controllers/events.controller';
import { verifyToken } from '../middleware/verifyToken';

export class EventsRoutes {
  eventsController: EventsController = new EventsController();

  routes(app): void {
    // Contact
    app.route('/events').get((req: Request, res: Response, next: NextFunction) => {
      // middleware
      console.log(`Request from: ${req.originalUrl}`);
      console.log(`Request type: ${req.method}`);
      next();
    }, this.eventsController.getEvents);

    app
      .use(verifyToken)
      .route('/events')
      .post(this.eventsController.addEvent);
  }
}
