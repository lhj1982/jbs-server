import * as mongoose from 'mongoose';
import { ShopSchema } from './shop.model';

const Schema = mongoose.Schema;
// const Shop = mongoose.model('Shop', ShopSchema);

export const ScriptSchema = new Schema({
  name: {
    type: String
  },
  key: {
    type: String
  },
  description: {
    type: String
  },
  minNumberOfPersons: {
    type: Number
  },
  maxNumberOfPersons: {
    type: Number
  },
  duration: {
    type: Number
  },
  introImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  shops: [{ type: String, ref: 'Shop' }]
});
