import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserTagSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    tag: { type: Schema.Types.ObjectId, ref: 'Tag' },
    type: {
      type: String,
      enum: ['event_user']
    },
    objectId: {
      type: String
    },
    taggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
