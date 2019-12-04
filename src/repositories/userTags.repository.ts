import * as mongoose from 'mongoose';
import { UserTagSchema } from '../models/userTag.model';
const UserTag = mongoose.model('UserTag', UserTagSchema, 'userTags');
mongoose.set('useFindAndModify', false);

class UserTagsRepo {
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
