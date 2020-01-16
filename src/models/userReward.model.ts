import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserRewardSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['host_event_completed', 'join_event_completed', 'user_endorsed', 'user_tagged', 'other']
  },
  objectId: {
    type: String // host_event_completed - eventId; join_event_completed - eventUserId; user_endorsed - eventUserId; user_tagged - eventUserId
  },
  points: {
    type: Number,
    required: 'Points is required'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiredAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
