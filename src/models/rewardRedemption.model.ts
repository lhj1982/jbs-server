import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const RewardRedemptionSchema = new Schema({
  type: {
    type: String,
    enum: ['partner_service', 'voucher', 'product_shop', 'other']
    // partner_service - external customer serivce;
    // voucher - exchangable voucher code;
    // product_shop - offer relevant internal product
    // other - other way of redemption, such as donation, charity etc
  },
  title: {
    type: String,
    required: 'Redemption Name is required.'
  },
  subtitle: {
    type: String
  },
  description: {
    type: String
  },
  scope: {
    type: String
  },
  validPeriod: {
    type: String
  },
  reminder: {
    type: String
  },
  instruction1: {
    type: String
  },
  instruction2: {
    type: String
  },
  note: {
    type: String
  },
  imageUrl: {
    type: String
  },
  quantity: {
    type: Number
  },
  points: {
    type: Number
  },
  available: {
    type: Number
  },
  externalCustomer: {
    type: Schema.Types.ObjectId,
    ref: 'ExternalCustomer'
  },
  status: {
    type: String,
    enum: ['active', 'expired']
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
