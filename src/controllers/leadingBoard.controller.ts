import { Request, Response, NextFunction } from 'express';
import LeadingBoardService from '../services/leadingBoard.service';
import { BaseController } from './base.controller';

export class LeadingBoardController extends BaseController {
  getLeadingBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadingBoard = await LeadingBoardService.getLeadingBoard();
      res.json({ code: 'SUCCESS', data: leadingBoard });
    } catch (err) {
      next(err);
    }
  };
}
