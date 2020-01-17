import { Request, Response, NextFunction } from 'express';
import { RewardRedemptionsController } from '../controllers/rewardRedemptions.controller';
import { verifyToken } from '../middleware/verifyToken';

export class RewardsRoutes {
  rewardRedemptionsController: RewardRedemptionsController = new RewardRedemptionsController();

  routes(app): void {
    //
    app.route('/rewards/redemptions').get(verifyToken, this.rewardRedemptionsController.getActiveRewardRedemptions);
  }
}
