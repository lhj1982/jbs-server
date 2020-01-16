import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserRewardRedemptionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['partner_service', 'voucher', 'product_shop', 'other']
    // partner_service - external customer serivce;
    // voucher - exchangable voucher code;
    // product_shop - offer relevant internal product
    // other - other way of redemption, such as donation, charity etc
  },
  description: {
    type: String
  },
  voucherCode: {
    type: String
  },
  voucherValue: {
    type: Number // voucher equivlent value, in cent
  },
  points: {
    type: Number
  },
  externalCustomerId: {
    type: Schema.Types.ObjectId,
    ref: 'ExternalCustomer'
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
