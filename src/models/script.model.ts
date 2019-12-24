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
    estimatedPrice: {
      type: String
    },
    priority: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['offline', 'online'],
      default: 'offline'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tags: [String]
    // shops: [{ type: String, ref: 'Shop' }]
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ScriptSchema.virtual('shops', {
  ref: 'Shop',
  localField: '_id',
  foreignField: 'scripts'
});

ScriptSchema.virtual('discountRuleMap', {
  ref: 'DiscountRuleMap',
  localField: '_id',
  foreignField: 'script'
});

ScriptSchema.virtual('events', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'script'
});
