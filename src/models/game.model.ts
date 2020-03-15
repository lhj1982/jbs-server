import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const GameSchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    hostUser: { type: Schema.Types.ObjectId, ref: 'User' },
    hostUserMobile: {
      type: String
    },
    hostUserWechatId: {
      type: String
    },
    hostComment: {
      type: String
    },
    numberOfPersons: {
      type: Number
    },
    roomId: {
      type: String,
      description: 'Game room id'
    },
    code: {
      type: String,
      description: 'Room code',
      required: 'Code is required'
    },
    status: {
      type: String,
      enum: ['ready', 'completed', 'expired', 'cancelled'],
      default: 'ready'
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
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

GameSchema.virtual('players', {
  ref: 'GamePlayer',
  localField: '_id',
  foreignField: 'game'
});

GameSchema.virtual('scriptClues', {
  ref: 'GameScriptClue',
  localField: '_id',
  foreignField: 'game'
});
