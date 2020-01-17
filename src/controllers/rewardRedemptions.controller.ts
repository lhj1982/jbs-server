import { Request, Response, NextFunction } from 'express';
// import { InvalidRequestException, ResourceAlreadyExist, ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import RewardService from '../services/reward.service';

export class RewardRedemptionsController extends BaseController {
  getActiveRewardRedemptions = async (req: Request, res: Response, next: NextFunction) => {
    const rewards = await RewardService.getRewardRedemptions({
      status: 'active'
    });
    try {
      res.json({
        code: 'SUCCESS',
        data: rewards
      });
    } catch (err) {
      next(err);
    }
  };
}
