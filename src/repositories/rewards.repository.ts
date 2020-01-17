import * as mongoose from 'mongoose';
import { TagSchema } from '../models/tag.model';
const Tag = mongoose.model('Tag', TagSchema);
mongoose.set('useFindAndModify', false);

class TagsRepo {
  async find(params) {
    return await Tag.find(params).exec();
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Tag.findById(mongoose.Types.ObjectId(id)).exec();
  }

  async findByName(name: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Tag.find({ name: name })
      .findOne()
      .exec();
  }
}
export default new TagsRepo();
