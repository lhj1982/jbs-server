import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserEndorsementSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['event_user']
    },
    objectId: {
      type: String
    },
    endorsedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
