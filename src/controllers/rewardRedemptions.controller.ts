import { Request, Response, NextFunction } from 'express';
import { ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { BaseController } from './base.controller';
import RewardRedemptionsRepo from '../repositories/rewardRedemptions.repository';
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

  applyRewardRedemption = async (req: Request, res: Response, next: NextFunction) => {
    const { loggedInUser } = res.locals;
    const { rewardRedemptionId } = req.params;
    try {
      const rewardRedemption = await RewardRedemptionsRepo.findById(rewardRedemptionId);
      if (!rewardRedemption) {
        throw new ResourceNotFoundException('RewardRedemption', rewardRedemptionId);
        return;
      }
      const { status } = rewardRedemption;
      if (status !== 'active') {
        throw new ResourceNotFoundException('RewardRedemption', rewardRedemptionId);
        return;
      }
      const userRewardRedemption = await RewardService.applyRewardRedemption(rewardRedemption, loggedInUser);
      res.json({ code: 'SUCCESS', data: userRewardRedemption });
    } catch (err) {
      next(err);
    }
  };
}
