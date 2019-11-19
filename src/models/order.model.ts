import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const OrderSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['event_join']
    },
    objectId: {
      type: String
    },
    amount: {
      type: Number
    },
    outTradeNo: {
      tytpe: String
    },
    status: {
      type: String,
      enum: ['created', 'completed', 'failed']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    payment: {}
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
