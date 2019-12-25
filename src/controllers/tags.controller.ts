import { Request, Response, NextFunction } from 'express';
// import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import TagService from '../services/tag.service';

export class TagsController extends BaseController {
  getTags = async (req: Request, res: Response, next: NextFunction) => {
    const tags = await TagService.getTags();
    try {
      res.json({
        code: 'SUCCESS',
        data: tags
      });
    } catch (err) {
      next(err);
    }
  };
}
