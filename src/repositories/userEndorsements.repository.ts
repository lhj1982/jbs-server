import * as mongoose from 'mongoose';
import { UserEndorsementSchema } from '../models/userEndorsement.model';
const UserEndorsement = mongoose.model('UserEndorsement', UserEndorsementSchema, 'userEndorsements');
mongoose.set('useFindAndModify', false);

class UserEndorsementsRepo {
  async getEndorsements(params) {
    return await UserEndorsement.find(params).exec();
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
