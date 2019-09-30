import * as mongoose from 'mongoose';
import { RoleSchema } from '../models/role.model';
const Role = mongoose.model('Role', RoleSchema);
mongoose.set('useFindAndModify', false);

class RolesRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Role.findById(mongoose.Types.ObjectId(id)).exec();
  }

  async findByName(name: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Role.find({ name: name })
      .findOne()
      .exec();
  }
}
export default new RolesRepo();
