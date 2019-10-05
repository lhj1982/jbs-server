import * as mongoose from 'mongoose';
// import { ScriptSchema } from './script.model';

const Schema = mongoose.Schema;
// const Script = mongoose.model('Script', ScriptSchema);

export const ShopSchema = new Schema({
  name: {
    type: String
  },
  key: {
    type: String,
    required: 'shop key is required!'
  },
  address: {
    type: String
  },
  mobile: {
    type: String
  },
  wechatId: {
    type: String
  },
  wechatName: {
    type: String
  },
  phone: {
    type: String
  },
  userId: {
    type: String
  },
  province: {
    type: String
  },
  city: {
    type: String
  },
  district: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  scripts: [{ type: Schema.Types.ObjectId, ref: 'Script' }]
});
