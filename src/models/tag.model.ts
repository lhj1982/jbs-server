import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const TagSchema = new Schema(
  {
    key: {
      type: String,
      required: 'Tag key is required.'
    },
    name: {
      type: String,
      required: 'Tag name is required.'
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
