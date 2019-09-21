import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserSchema = new Schema({
  openId: {
    type: String
  },
  invitationCode: {
    type: String
  },
  isUsed: {
    type: Boolean
  },
  expriedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
