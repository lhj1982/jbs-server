import { Request, Response, NextFunction } from 'express';
import LeadingBoardService from '../services/leadingBoard.service';
import { BaseController } from './base.controller';
import { date2String } from '../utils/dateUtil';

export class LeadingBoardController extends BaseController {
  getLeadingBoard = async (req: Request, res: Response, next: NextFunction) => {
    let { validFor } = req.query;
    if (!validFor) {
      validFor = date2String(new Date(), 'YYYY-MM-DD');
    }
    try {
      const leadingBoard = await LeadingBoardService.getLeadingBoard(validFor);
      res.json({ code: 'SUCCESS', data: leadingBoard });
    } catch (err) {
      next(err);
    }
  };

  updateLeadingBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await LeadingBoardService.updateLeadingBoard();
      res.json({ code: 'SUCCESS' });
    } catch (err) {
      next(err);
    }
  };
}
