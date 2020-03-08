import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const ScriptClueSchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ScriptClueCategory'
      }
    ],
    title: {
      type: String
    },
    content: {
      type: String
    },
    round: {
      type: String
    },
    public: {
      type: Boolean,
      default: false
    },
    images: [
      {
        type: String
      }
    ]
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
