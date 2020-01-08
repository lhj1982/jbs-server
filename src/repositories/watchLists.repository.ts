import * as mongoose from 'mongoose';
import { WatchListSchema } from '../models/watchList.model';
const WatchList = mongoose.model('WatchList', WatchListSchema, 'watchLists');
import { CommonRepo } from './common.repository';
mongoose.set('useFindAndModify', false);

class WatchListsRepo extends CommonRepo {
  async find(params) {
    return await WatchList.find(params)
      .populate('user', ['-password'])
      .populate('script')
      .populate('shop')
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
