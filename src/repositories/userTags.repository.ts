import * as mongoose from 'mongoose';
import { UserTagSchema } from '../models/userTag.model';
import { UserSchema } from '../models/user.model';
const UserTag = mongoose.model('UserTag', UserTagSchema, 'userTags');
const User = mongoose.model('User', UserSchema, 'users');
mongoose.set('useFindAndModify', false);

class UserTagsRepo {
  async findByUser(params) {
    return await UserTag.find(params)
      .populate({
        path: 'taggedBy',
        select: '-password -sessionKey'
      })
      .populate('tag')
      .exec();
  }

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

  async updateAllTagsGroupByUser(fromDate: string, status: string[] = ['completed']) {
    const tagsResult = await UserTag.aggregate([
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
          _id: '$user',
          tagsArr: {
            $addToSet: {
              _id: '$tagObj._id',
              name: '$tagObj.name',
              taggedBy: '$taggedBy'
            }
          }
        }
      },
      {
        $addFields: { user: '$_id' }
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: {
          count: -1
        }
      }
    ]).exec();
    // console.log(JSON.stringify(tagsResult));
    const result = [];
    for (let i = 0; i < tagsResult.length; i++) {
      const { user, tagsArr } = tagsResult[i];
      const tags = this.getTags(tagsArr);
      result.push({
        user,
        tags
      });
    }
    // console.log(result);
    return new Promise((resolve, reject) => {
      if (result.length === 0) {
        resolve();
      } else {
        const bulk = User.collection.initializeUnorderedBulkOp();
        result.forEach(userTags => {
          const { user, tags } = userTags;
          // console.log(user + ', ' + count);
          bulk.find({ _id: user }).update({ $set: { topTags: tags } });
        });

        bulk.execute((err, bulkres) => {
          if (err) {
            return reject(err);
          } else {
            // console.log(bulkres);
            resolve(bulkres);
          }
        });
      }
    });
  }

  /**
   * Result: [{_id, name, count}]
   *
   * @param {[type]} tagsArr [description]
   */
  getTags(tagsArr) {
    const result = [];
    tagsArr.forEach(_ => {
      const { _id, name } = _;
      const checkExist = this.existingTag(_id, result);
      const { existing, index } = checkExist;
      if (!existing) {
        result.push({
          _id,
          name,
          count: 1
        });
      } else {
        // if existing tag, increase count by 1;
        const { count } = result[index];
        result[index].count = count + 1;
      }
    });
    return result.sort(this.compareDesc);
  }

  existingTag(_id, tags) {
    let existing = { existing: false, index: undefined };
    for (let i = 0; i < tags.length; i++) {
      const { _id: existingTagId } = tags[i];
      if (existingTagId.toString() === _id.toString()) {
        existing = { existing: true, index: i };
        break;
      }
    }
    return existing;
  }

  compareDesc(a, b) {
    // Use toUpperCase() to ignore character casing
    const { count: countA } = a;
    const { count: countB } = b;
    let comparison = 0;
    if (countA > countB) {
      comparison = -1;
    } else if (countA < countB) {
      comparison = 1;
    }
    return comparison;
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
