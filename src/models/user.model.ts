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
    username: {
      type: String
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
    mobileCountryCode: {
      type: String
    },
    contactMobile: {
      type: String
    },
    age: {
      type: Number
    },
    ageTag: {
      type: String
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
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'inactive'
    },
    numberOfEndorsements: {
      type: Number
    },
    topTags: [
      {
        _id: {
          type: String
        },
        name: {
          type: String
        },
        count: {
          type: Number
        }
      }
    ],
    credits: {
      type: Number,
      default: 0
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.virtual('shopStaffs', {
  ref: 'ShopStaff',
  localField: '_id',
  foreignField: 'user'
});

UserSchema.virtual('userRewardRedemptions', {
  ref: 'UserRewardRedemption',
  localField: '_id',
  foreignField: 'user'
});
