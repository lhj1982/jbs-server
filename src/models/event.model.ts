import * as mongoose from 'mongoose';

// import { ShopSchema } from './shop.model';
// import { ScriptSchema } from './script.model';
// import { UserSchema } from './user.model';
// import { EventUserSchema } from './eventUser.model';
// import { DiscountRuleSchema } from './discountRule.model';

const Schema = mongoose.Schema;
// const Shop = mongoose.model('Shop', ShopSchema);
// const Script = mongoose.model('Script', ScriptSchema);
// const User = mongoose.model('User', UserSchema);
// const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema);

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
    hostUserMobile: {
      type: String
    },
    hostUserWechatId: {
      type: String
    },
    hostComment: {
      type: String
    },
    minNumberOfPersons: {
      type: Number
    },
    maxNumberOfPersons: {
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
    minNumberOfAvailableSpots: {
      type: Number,
      default: 0
    },
    maxNumberOfAvailableSpots: {
      type: Number,
      default: 0
    },
    price: Number,
    discountRule: {
      type: Schema.Types.ObjectId,
      ref: 'DiscountRule'
    },
    status: {
      type: String,
      enum: ['ready', 'completed', 'expired', 'cancelled'],
      default: 'ready'
    },
    supportPayment: {
      type: Boolean,
      default: false
    },
    isHostJoin: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EventSchema.virtual('members', {
  ref: 'EventUser',
  localField: '_id',
  foreignField: 'event'
});
EventSchema.virtual('commissions', {
  ref: 'EventCommission',
  localField: '_id',
  foreignField: 'event'
});
