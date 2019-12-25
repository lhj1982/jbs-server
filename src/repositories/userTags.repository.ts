import * as mongoose from 'mongoose';
import { UserTagSchema } from '../models/userTag.model';
const UserTag = mongoose.model('UserTag', UserTagSchema, 'userTags');
mongoose.set('useFindAndModify', false);

class UserTagsRepo {
  async getUserTagsByTagId(params) {
    const { tag, type, objectId, user } = params;
    const response = UserTag.aggregate([
      {
        $match: {
          user,
          type,
          objectId
        }
      },
      {
        $lookup: {
          from: 'tags',
          localField: 'tag',
          foreignField: '_id',
          as: 'tagObj'
        }
      },
      {
        $unwind: {
          path: '$tagObj'
        }
      },
      {
        $group: {
          _id: '$tag',
          count: {
            $sum: 1
          }
        }
      },
      {
        $addFields: { tag: '$_id' }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    return response;
  }

  async saveOrUpdate(userTag, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { taggedBy, user, tag, type, objectId } = userTag;

    return await UserTag.findOneAndUpdate({ taggedBy, user, tag, type, objectId }, userTag, options).exec();
  }
}

export default new UserTagsRepo();
