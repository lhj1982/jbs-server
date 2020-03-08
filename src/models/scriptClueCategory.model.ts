import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const ScriptClueCategorySchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    key: {
      type: String
    },
    title: {
      type: String
    },
    field: {
      type: String
    },
    value: {
      type: String
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
