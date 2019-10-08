import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const NotificationSchema = new Schema({
  taskId: {
    type: String,
    required: 'Task id is required'
  },
  message: {
    type: String,
    required: 'Message is required'
  },
  mobiles: [
    {
      type: String
    }
  ],
  statusCode: {
    type: String
  },
  status: {
    type: String
  },
  serialNumber: {
    type: String
  },
  sendDate: {
    type: Date
  }
});
