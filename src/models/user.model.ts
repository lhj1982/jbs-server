import * as mongoose from 'mongoose';
// import { RoleSchema } from './role.model';

const Schema = mongoose.Schema;
// const Role = mongoose.model('Role', RoleSchema);

export const UserSchema = new Schema(
  {
    openId: {
      type: String
    },
    unionId: {
      type: String
    },
    sessionKey: {
      type: String
    },
    nickName: {
      type: String,
      required: 'UserName is required'
    },
    password: {
      type: String
      // required: 'Password is required'
    },
    description: {
      type: String
    },
    avatarUrl: {
      type: String
    },
    province: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
    },
    language: {
      type: String
    },
    email: {
      type: String
    },
    company: {
      type: String
    },
    phone: {
      type: String
    },
    mobile: {
      type: String
    },
    contactMobile: {
      type: String
    },
    age: {
      type: Number
    },
    gender: {
      type: String,
      enum: ['male', 'female']
    },
    birthday: {
      type: String
    },
    wechatId: {
      type: String
    },
    accessToken: {
      type: String
    },
    expriedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }]
  },
  { toJSON: { virtuals: true } }
);
