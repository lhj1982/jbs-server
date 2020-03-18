import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const GameScriptClueSchema = new Schema(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game' },
    scriptClue: { type: Schema.Types.ObjectId, ref: 'ScriptClue' },
    owner: {
      type: String
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
