import * as mongoose from 'mongoose';
import { ShopSchema } from './shop.model';
import { ScriptSchema } from './script.model';

const Schema = mongoose.Schema;
const Shop = mongoose.model('Shop', ShopSchema);
const Script = mongoose.model('Script', ScriptSchema);

export const DiscountRulesSchema = new Schema({
  script: { type: Schema.Types.ObjectId, ref: 'Script' },
  shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
  rules: {
    days: [{ type: String }],
    timeSpan: [{ type: String }],
    discountPercentage: Number,
    discountInAmount: Number
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
