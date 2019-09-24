import { Request, Response, NextFunction } from 'express';
import { EventsController } from '../controllers/events.controller';
import { verifyToken } from '../middleware/verifyToken';

export class EventsRoutes {
  eventsController: EventsController = new EventsController();

  routes(app): void {
    // Contact
    app
      .route('/events')
      .get(
        verifyToken,
        (req: Request, res: Response, next: NextFunction) => {
          // middleware
          console.log(`Request from: ${req.originalUrl}`);
          console.log(`Request type: ${req.method}`);
          next();
        },
        this.eventsController.getEvents
      )
      .post(verifyToken, this.eventsController.addEvent);

    app.route('/events/:eventId').get(verifyToken, this.eventsController.getEventDetails);
    app.route('/events/:eventId/join').post(verifyToken, this.eventsController.joinEvent);
  }
}
