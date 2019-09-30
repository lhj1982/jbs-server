import * as mongoose from 'mongoose';
import { ShopSchema } from './shop.model';
import { ScriptSchema } from './script.model';

const Schema = mongoose.Schema;
const Shop = mongoose.model('Shop', ShopSchema);
const Script = mongoose.model('Script', ScriptSchema);

export const DiscountRulesSchema = new Schema({
  key: { type: String },
  title: { type: String },
  description: { type: String },
  days: [{ type: String }],
  timeSpan: [
    {
      from: { type: String },
      to: { type: String }
    }
  ],
  discount: {
    sponsor: { type: Number },
    participator: { type: Number }
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
