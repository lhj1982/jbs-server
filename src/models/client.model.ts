import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ClientSchema = new Schema({
  name: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
