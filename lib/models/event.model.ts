import * as mongoose from 'mongoose';
import { ShopSchema } from './shop.model';
import { ScriptSchema } from './script.model';
import { UserSchema } from './user.model';

const Schema = mongoose.Schema;
const Shop = mongoose.model('Shop', ShopSchema);
const Script = mongoose.model('Script', ScriptSchema);
const User = mongoose.model('User', UserSchema);

export const EventSchema = new Schema({
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
  price: {
    weekdayDayPrice: Number,
    weekdayNightPrice: Number,
    weekendPrice: Number
  },
  status: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
