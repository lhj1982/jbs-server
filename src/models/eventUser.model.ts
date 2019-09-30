import * as mongoose from 'mongoose';
import { EventSchema } from './event.model';
import { UserSchema } from './user.model';

const Schema = mongoose.Schema;
const Event = mongoose.model('Event', EventSchema);
const User = mongoose.model('User', UserSchema);

export const EventUserSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: {
    type: String
  },
  source: {
    type: String
  },
  mobile: {
    type: String,
    required: 'Mobile cannot be empty'
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'cancelled'],
    default: 'unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
