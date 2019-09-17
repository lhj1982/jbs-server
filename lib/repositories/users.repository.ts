import * as mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
const User = mongoose.model('User', UserSchema);
mongoose.set('useFindAndModify', false);

class UsersRepo {
  getAllCourses(options) {
    return User.findAll(options);
  }

  async find(params) {
    return await User.find(params).exec();
  }

  async saveAccessToken(user) {
    await User.save(user).exec();
  }

  async saveOrUpdateUser(user) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    };
    return await User.findOneAndUpdate({ openId: user.openId }, user, options).exec();
  }
}
export default new UsersRepo();
