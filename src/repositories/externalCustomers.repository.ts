import * as mongoose from 'mongoose';
import { ExternalCustomerSchema } from '../models/externalCustomer.model';
const ExternalCustomer = mongoose.model('ExternalCustomer', ExternalCustomerSchema);
mongoose.set('useFindAndModify', false);

class ExternalCustomersRepo {
  async find(params) {
    return await ExternalCustomer.find(params).exec();
  }

  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await ExternalCustomer.findById(mongoose.Types.ObjectId(id)).exec();
  }
}
export default new ExternalCustomersRepo();
