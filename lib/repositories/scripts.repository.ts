import * as mongoose from 'mongoose';
import { ScriptSchema } from '../models/script.model';
const Script = mongoose.model('Script', ScriptSchema);
mongoose.set('useFindAndModify', false);

class ScriptsRepo {
  
  async find(params) {
    return await Script.find(params).exec();
  }

  async saveOrUpdateShop(shop) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    };
    return await Script.findOneAndUpdate({ _id: shop.id }, shop, options).exec();
  }
}
export default new ScriptsRepo();
