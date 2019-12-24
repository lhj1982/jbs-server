import ScriptsRepo from '../repositories/scripts.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import { ResourceNotFoundException } from '../exceptions/custom.exceptions';

class ScriptService {
  async findById(scriptId: string): Promise<any> {
    const script = await ScriptsRepo.findById(scriptId);
    if (!script) {
      throw new ResourceNotFoundException(`Script`, scriptId);
    }
    const eventUsers = await EventUsersRepo.findByScript(scriptId);
    const users = eventUsers.map(_ => {
      const {
        user: { _id, nickName, avatarUrl }
      } = _;
      return { _id, id: _id, nickName, avatarUrl };
    });
    return Object.assign({}, script.toObject(), {users});
  }
}

export default new ScriptService();
