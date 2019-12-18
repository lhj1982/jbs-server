import { Request, Response, NextFunction } from 'express';
import { LeadingBoardController } from '../controllers/leadingBoard.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class LeadingBoardRoutes {
  leadingBoardController: LeadingBoardController = new LeadingBoardController();

  routes(app): void {
    //
    app.route('/leading-board').get(this.leadingBoardController.getLeadingBoard);
  }
}
