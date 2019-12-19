import * as mongoose from 'mongoose';
import { UserPointSchema } from '../models/userPoint.model';
import { CommonRepo } from './common.repository';
const UserPoint = mongoose.model('UserPoint', UserPointSchema);
mongoose.set('useFindAndModify', false);

class UserPointsRepo extends CommonRepo {
  async saveOrUpdate(userPoint, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { user, type, points, createdAt } = userPoint;
    return await UserPoint.findOneAndUpdate({ user, type, points, createdAt }, userPoint, options).exec();
  }
}

export default new UserPointsRepo();
