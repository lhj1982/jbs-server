import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const NotificationSchema = new Schema({
  // key is used for identify a search key of a notification message
  key: {
    type: String,
    required: 'Key is required'
  },
  taskid: {
    type: String,
    required: 'Task id is required'
  },
  eventType: {
    type: String,
    enum: ['event_created', 'event_joined', 'event_completed']
  },
  audience: {
    type: String // shop, host or participator
  },
  objectId: {
    type: String
  },
  message: {
    type: String,
    required: 'Message is required'
  },
  smsMessage: {
    type: String
  },
  recipients: [
    {
      type: String
    }
  ],
  serialNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['created', 'sent', 'delivered'],
    default: 'created'
  },
  result: {
    type: String
  },
  description: {
    type: String
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  reports: [
    {
      taskid: {
        type: String
      },
      recipient: {
        type: String
      },
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
    }
  ]
});
