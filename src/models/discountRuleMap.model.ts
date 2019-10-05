import * as mongoose from 'mongoose';
// import { ShopSchema } from './shop.model';
// import { ScriptSchema } from './script.model';
// import { DiscountRuleSchema } from './discountRule.model';

const Schema = mongoose.Schema;
// const Shop = mongoose.model('Shop', ShopSchema);
// const Script = mongoose.model('Script', ScriptSchema);
// const DiscountRule = mongoose.model('DiscountRule', DiscountRuleSchema);

export const DiscountRuleMapSchema = new Schema(
  {
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    discountRule: { type: Schema.Types.ObjectId, ref: 'DiscountRule' },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true } }
);
