import * as mongoose from 'mongoose';
import { ShopSchema } from './shop.model';
import { ScriptSchema } from './script.model';
import { UserSchema } from './user.model';
import { EventUserSchema } from './eventUser.model';

const Schema = mongoose.Schema;
const Shop = mongoose.model('Shop', ShopSchema);
const Script = mongoose.model('Script', ScriptSchema);
const User = mongoose.model('User', UserSchema);
// const EventUser = mongoose.model('EventUser', EventUserSchema);

export const EventSchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    hostUser: { type: Schema.Types.ObjectId, ref: 'User' },
    hostComment: {
      type: String
    },
    numberOfPersons: {
      type: Number
    },
    numberOfOfflinePersons: {
      type: Number,
      default: 0
    },
    numberOfParticipators: {
      type: Number,
      default: 0
    },
    numberOfAvailableSpots: {
      type: Number,
      default: 0
    },
    price: Number,
    status: {
      type: String,
      enum: ['ready', 'complete', 'expired', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true } }
);

EventSchema.virtual('members', {
  ref: 'EventUser',
  localField: '_id',
  foreignField: 'event'
});
