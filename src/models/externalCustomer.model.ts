import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const ExternalCustomerSchema = new Schema(
  {
    key: {
      type: String,
      required: 'customer key is required.'
    },
    name: {
      type: String,
      required: 'customer name is required.'
    },
    description: {
      type: String
    },
    address: {
      type: String
    },
    imageUrl: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
