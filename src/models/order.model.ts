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
    commissionAmount: {
      type: Number
    },
    outTradeNo: {
      tytpe: String
    },
    orderStatus: {
      type: String,
      enum: ['created', 'paid', 'refund_requested', 'refund'],
      default: 'created'
    },
    commissionStatus: {
      type: String,
      enum: ['refund']
    },
    // paymentStatus: {
    // 	type: String,
    // 	enum: ['unpaid', 'paid'],
    // 	default: 'unpaid'
    // },
    // status: {
    //   type: String,
    //   enum: ['created', 'completed', 'failed', 'paid_pending', 'paid', 'refund_requested', 'refund_pending', 'refund']
    // },
    message: {
      type: String
    },
    refundRequestedAt: {
    	type: Date
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
    commissionRefunds: [
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
    ],
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
