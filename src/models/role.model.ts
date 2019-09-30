import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const RoleSchema = new Schema({
  name: {
    type: String
  },
  permissions: [
    {
      domain: String,
      operations: [{ type: String }]
    }
  ]
});
