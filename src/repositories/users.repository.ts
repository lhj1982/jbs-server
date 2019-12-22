import * as mongoose from 'mongoose';
import { UserSchema } from '../models/user.model';
import { EventCommissionSchema } from '../models/eventCommissions.model';
import EventUsersRepo from './eventUsers.repository';
import { CommonRepo } from './common.repository';
import * as bcrypt from 'bcrypt';
const User = mongoose.model('User', UserSchema);
const EventCommission = mongoose.model('EventCommission', EventCommissionSchema, 'eventCommissions');

mongoose.set('useFindAndModify', false);

class UsersRepo extends CommonRepo {
  async getSession() {
    return super.getSession(User);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await User.where({ _id: id })
      .findOne()
      .populate('roles', ['name', 'permissions'])
      .select('-password')
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
      .populate('roles', ['name'])
      .select('-password')
      .exec();
  }

  async findByUserNameAndPassword(username, password) {
    const user = await User.where({ username })
      .findOne()
      .exec();
    if (user) {
      if (bcrypt.compareSync(password, user.password)) {
        return user;
      }
    }
    return null;
  }

  async getMostCommissionEntry() {
    const commissions = await EventCommission.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventObj'
        }
      },
      {
        $unwind: {
          path: '$eventObj'
        }
      },
      {
        $match: {
          'eventObj.status': 'completed'
        }
      },
      {
        $sort: {
          'commissions.host.amount': -1
        }
      },
      {
        $limit: 1
      },
      {
        $lookup: {
          from: 'users',
          localField: 'commissions.host.user',
          foreignField: '_id',
          as: 'hostUser'
        }
      },
      {
        $unwind: {
          path: '$hostUser',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
    const commission = undefined;
    if (commissions.length > 0) {
      return commissions[0];
    }
    return commission;
  }

  async getMostCommissionAllEventEntry() {
    const commissions = await EventCommission.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventObj'
        }
      },
      {
        $unwind: {
          path: '$eventObj'
        }
      },
      {
        $match: {
          'eventObj.status': 'completed'
        }
      },
      {
        $group: {
          _id: '$commissions.host.user',
          totalHostAmount: {
            $sum: '$commissions.host.amount'
          }
        }
      },
      {
        $addFields: { user: '$_id' }
      },
      {
        $sort: {
          totalHostAmount: -1
        }
      },
      {
        $project: { _id: 0 }
      },
      {
        $limit: 1
      }
    ]).exec();
    const commission = undefined;
    if (commissions.length > 0) {
      return commissions[0];
    }
    return commission;
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

  // async getUserEvents(userId: string) {
  //   return await EventUsersRepo.findByUser(userId);
  // }
}
export default new UsersRepo();
