import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const GamePlayerSchema = new Schema(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game' },
    playerId: {
      type: String
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
