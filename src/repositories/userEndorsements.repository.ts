import * as mongoose from 'mongoose';
import { UserEndorsementSchema } from '../models/userEndorsement.model';
const UserEndorsement = mongoose.model('UserEndorsement', UserEndorsementSchema, 'userEndorsements');
mongoose.set('useFindAndModify', false);

class UserEndorsementsRepo {
  async saveOrUpdate(userEndorsement, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { taggedBy, user, type, objectId } = userEndorsement;

    return await UserEndorsement.findOneAndUpdate({ taggedBy, user, type, objectId }, userEndorsement, options).exec();
  }
}

export default new UserEndorsementsRepo();
