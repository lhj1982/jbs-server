import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const ScriptRundownSchema = new Schema(
  {
    script: { type: Schema.Types.ObjectId, ref: 'Script' },
    players: [
      {
        id: String,
        name: String,
        description: String,
        rundown: [
          {
            title: String,
            content: String
          }
        ]
      }
    ],
    tags: [
      {
        name: String
      }
    ]
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
