import * as mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
import EventUsersRepo from './eventUsers.repository';
const User = mongoose.model('User', UserSchema);
mongoose.set('useFindAndModify', false);

class UsersRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await User.where({ _id: id })
      .findOne()
      .populate('roles', ['_id', 'name', 'permissions'])
      .exec();
  }

  getAllCourses(options) {
    return User.findAll(options);
  }

  async find(params) {
    return await User.find(params).exec();
  }

  async findOne(params) {
    return await User.where(params)
      .findOne()
      .exec();
  }

  async saveAccessToken(user) {
    await User.save(user).exec();
  }

  async saveOrUpdateUser(user, opts: object = {}) {
    const options = {
      ...opts,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await User.findOneAndUpdate({ openId: user.openId }, user, options).exec();
  }

  async getUserEvents(userId: string) {
    return await EventUsersRepo.findByUser(userId);
  }
}
export default new UsersRepo();
