import * as mongoose from 'mongoose';
import { UserEndorsementSchema } from '../models/userEndorsement.model';
import { UserSchema } from '../models/user.model';
const UserEndorsement = mongoose.model('UserEndorsement', UserEndorsementSchema, 'userEndorsements');
const User = mongoose.model('User', UserSchema, 'users');
mongoose.set('useFindAndModify', false);

class UserEndorsementsRepo {
  async findByUser(params) {
    return await UserEndorsement.find(params)
      .populate({
        path: 'endorsedBy',
        select: '-password -sessionKey'
      })
      .exec();
  }

  // async getEndorsements(params) {
  //   return await UserEndorsement.find(params).exec();
  // }

  /**
   * Get number of endorsements of all users.
   */
  async updateAllEndorsementGroupByUser(fromDate: string, status: string[] = ['completed']) {
    const endorsements = await UserEndorsement.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
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
    return new Promise((resolve, reject) => {
      if (endorsements.length === 0) {
        resolve();
      } else {
        const bulk = User.collection.initializeUnorderedBulkOp();
        endorsements.forEach(endorsement => {
          const { user, count } = endorsement;
          // console.log(user + ', ' + count);
          bulk.find({ _id: user }).update({ $set: { numberOfEndorsements: count } });
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

  async delete(userEndorsement, opt = {}) {
    const options = {
      ...opt
    };
    const { endorsedBy, user, type, objectId } = userEndorsement;
    return await UserEndorsement.findOneAndRemove({ endorsedBy, user, type, objectId }, options).exec();
  }

  async saveOrUpdate(userEndorsement, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { endorsedBy, user, type, objectId } = userEndorsement;

    return await UserEndorsement.findOneAndUpdate({ endorsedBy, user, type, objectId }, userEndorsement, options).exec();
  }
}

export default new UserEndorsementsRepo();
