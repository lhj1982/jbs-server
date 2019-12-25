import { Request, Response, NextFunction } from 'express';
import { TagsController } from '../controllers/tags.controller';
import { verifyToken } from '../middleware/verifyToken';

export class TagsRoutes {
  tagsController: TagsController = new TagsController();

  routes(app): void {
    //
    app.route('/tags').get(verifyToken, this.tagsController.getTags);
  }
}
