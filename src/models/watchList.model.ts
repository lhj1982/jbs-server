import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const WatchListSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['script_interested']
    },
    objectId: { type: 'string' },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
