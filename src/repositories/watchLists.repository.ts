import * as mongoose from 'mongoose';
import { WatchListSchema } from '../models/watchList.model';
const WatchList = mongoose.model('WatchList', WatchListSchema, 'watchLists');
import { CommonRepo } from './common.repository';
mongoose.set('useFindAndModify', false);

class WatchListsRepo extends CommonRepo {
  async find(params) {
    const { user, type, objectId } = params;
    const match = {
      type
    };
    if (user) {
      match['user'] = user;
    }
    if (objectId) {
      match['objectId'] = objectId;
    }
    return await WatchList.aggregate([
      {
        $match: match
      },
      {
        $addFields: {
          convertedObjectId: {
            $toObjectId: '$objectId'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userObj'
        }
      },
      {
        $unwind: {
          path: '$userObj'
        }
      },

      {
        $lookup: {
          from: 'scripts',
          localField: 'convertedObjectId',
          foreignField: '_id',
          as: 'scriptObj'
        }
      },
      {
        $unwind: {
          path: '$scriptObj'
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $project: {
          convertedObjectId: 0,
          user: 0
        }
      }
    ])
      // .populate('user', ['-password'])
      // .populate('script')
      .exec();
  }

  async delete(watchList, opts = {}) {
    const options = {
      ...opts
    };
    const { user, type, objectId } = watchList;
    return await WatchList.findOneAndRemove({ user, type, objectId }, options).exec();
  }

  async saveOrUpdate(watchList, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, type, objectId } = watchList;
    return await WatchList.findOneAndUpdate({ user, type, objectId }, watchList, options).exec();
  }
}

export default new WatchListsRepo();
