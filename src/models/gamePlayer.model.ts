import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const GamePlayerSchema = new Schema(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    playerId: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
