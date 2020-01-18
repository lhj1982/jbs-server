import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const DiscountRuleSchema = new Schema({
  key: { type: String },
  description: { type: String },
  timeDescription: { type: String },
  days: [{ type: String }],
  timeSpan: [
    {
      from: { type: String },
      to: { type: String }
    }
  ],
  discount: {
    host: { type: Number },
    participator: { type: Number }
  },
  exception: {
    dates: [{ type: String }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
