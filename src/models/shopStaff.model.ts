import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const ShopStaffSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
