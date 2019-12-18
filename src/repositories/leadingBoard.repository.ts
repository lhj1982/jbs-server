import * as mongoose from 'mongoose';
import { LeadingBoardSchema } from '../models/leadingBoard.model';
const LeadingBoard = mongoose.model('LeadingBoard', LeadingBoardSchema);
mongoose.set('useFindAndModify', false);

class LeadingBoardRepo {
  async find({}) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await LeadingBoard.find({})
      .populate({
        path: 'user',
        select: '_id openId nickName avatarUrl gender country province city language mobile wechatId ageTag'
      })
      .exec();
  }
}
export default new LeadingBoardRepo();
