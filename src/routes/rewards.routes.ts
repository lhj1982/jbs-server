import { Request, Response, NextFunction } from 'express';
import { RewardRedemptionsController } from '../controllers/rewardRedemptions.controller';
import { verifyToken } from '../middleware/verifyToken';
import permit from '../middleware/permission.middleware';

export class RewardsRoutes {
  rewardRedemptionsController: RewardRedemptionsController = new RewardRedemptionsController();

  routes(app): void {
    //
    app
      .route('/rewards/redemptions')
      .get(verifyToken, this.rewardRedemptionsController.getActiveRewardRedemptions)
      .post(verifyToken, permit({ domain: 'reward', operations: ['createRewardRedemption'] }), this.rewardRedemptionsController.createRewardRedemption);
    app.route('/rewards/redemptions/:rewardRedemptionId/apply').post(verifyToken, this.rewardRedemptionsController.applyRewardRedemption);
  }
}
