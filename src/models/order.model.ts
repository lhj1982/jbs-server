import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const OrderSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['event_join']
    },
    objectId: {
      type: String
    },
    amount: {
      type: Number
    },
    outTradeNo: {
      tytpe: String
    },
    status: {
      type: String,
      enum: ['created', 'completed', 'failed', 'paid', 'refund']
    },
    message: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    payment: {
      tradeType: {
        type: String
      },
      totalFee: {
        type: Number
      },
      settlementTotalFee: {
        type: Number
      },
      feeType: {
        type: String
      },
      cashFee: {
        type: Number
      },
      cashFeeType: {
        type: String
      },
      couponFee: {
        type: Number
      },
      couponCount: {
        type: Number
      },
      transactionId: {
        type: String
      },
      outTradeNo: {
        type: String
      },
      timeEnd: {
        type: Date
      }
    },
    refunds: [
      {
        refundId: {
          type: String
        },
        outRefundNo: {
          type: String
        },
        refundFee: {
          type: Number
        },
        status: {
          type: String
        }
      }
    ]
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
