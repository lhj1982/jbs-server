import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const LeadingBoardSchema = new Schema({
  type: {
    type: String,
    enum: [
      'most_commission_single_event',
      'most_host_event_count',
      'most_commission_all_events',
      'most_join_event_count_male',
      'most_join_event_count_female',
      'most_user_endorsements',
      'most_watched_scripts'
    ],
    required: 'Type is required.'
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  value: {
    type: String
  },
  data: {
    type: String // data in json string format
  },
  validFor: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
