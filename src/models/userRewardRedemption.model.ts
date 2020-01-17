import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserRewardRedemptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  rewardRedemption: { type: Schema.Types.ObjectId, ref: 'RewardRedemption' },
  voucherCode: {
    type: String
  },
  voucherValue: {
    type: Number // voucher equivlent value, in cent
  },
  points: {
    type: Number
  },
  status: {
    type: String,
    enum: ['created', 'used', 'invalid', 'expired']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiredAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
