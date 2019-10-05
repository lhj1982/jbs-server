import * as mongoose from 'mongoose';
// import { ShopSchema } from './shop.model';
// import { ScriptSchema } from './script.model';

const Schema = mongoose.Schema;
// const Shop = mongoose.model('Shop', ShopSchema);
// const Script = mongoose.model('Script', ScriptSchema);

export const PriceWeeklySchemaSchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    priceSchema: {
      days: [{ type: Number }],
      timeSpan: [{ type: String }],
      price: Number
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
  { toJSON: { virtuals: true } }
);
