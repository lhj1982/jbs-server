import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const ScriptSchema = new Schema(
  {
    name: {
      type: String
    },
    key: {
      type: String
    },
    description: {
      type: String
    },
    minNumberOfPersons: {
      type: Number
    },
    maxNumberOfPersons: {
      type: Number
    },
    duration: {
      type: Number
    },
    introImage: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tags: [String]
    // shops: [{ type: String, ref: 'Shop' }]
  },
  { toJSON: { virtuals: true } }
);

ScriptSchema.virtual('shops', {
  ref: 'Shop',
  localField: '_id',
  foreignField: 'scripts'
});
