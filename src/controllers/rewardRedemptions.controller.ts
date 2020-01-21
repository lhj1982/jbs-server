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

  createRewardRedemption = async (req: Request, res: Response, next: NextFunction) => {
    const { externalCustomerId, type, title, subtitle, description, points, quantity, scope, validPeriod, reminder, instruction1, instruction2, note, imageUrl } = req.body;
    try {
      const rewardRedeption = await RewardService.createRewardRedemption({
        externalCustomerId,
        type,
        title,
        subtitle,
        description,
        points,
        quantity,
        scope,
        validPeriod,
        reminder,
        instruction1,
        instruction2,
        note,
        imageUrl
      });
      res.json({ code: 'SUCCESS', data: rewardRedeption });
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
