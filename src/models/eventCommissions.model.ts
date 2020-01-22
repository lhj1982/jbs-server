import * as mongoose from 'mongoose';
// import { EventSchema } from './event.model';
// import { UserSchema } from './user.model';

const Schema = mongoose.Schema;
// const Event = mongoose.model('Event', EventSchema);
// const User = mongoose.model('User', UserSchema);

export const EventCommissionSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    commissions: {
      host: {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        amount: Number
      },
      participators: [
        {
          user: { type: Schema.Types.ObjectId, ref: 'User' },
          amount: Number
        }
      ]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
