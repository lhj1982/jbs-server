import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const DiscountRuleSchema = new Schema({
  key: { type: String },
  title: { type: String },
  description: { type: String },
  days: [{ type: String }],
  timeSpan: [
    {
      from: { type: String },
      to: { type: String }
    }
  ],
  discount: {
    sponsor: { type: Number },
    participator: { type: Number }
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
