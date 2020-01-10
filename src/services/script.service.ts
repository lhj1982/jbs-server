import ScriptsRepo from '../repositories/scripts.repository';
import EventUsersRepo from '../repositories/eventUsers.repository';
import WatchListsRepo from '../repositories/watchLists.repository';
import { ResourceNotFoundException } from '../exceptions/custom.exceptions';
import { nowDate } from '../utils/dateUtil';

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
    const watchList = await WatchListsRepo.find({
      objectId: scriptId,
      type: 'script_interested'
    });
    const watches = watchList.map(_ => {
      const {
        userObj: { _id, id, avatarUrl, nickName }
      } = _;
      return { _id, id, avatarUrl, nickName };
    });
    return Object.assign({}, script.toObject(), { users }, { watches });
  }

  async addToWatchList(scriptId: string, user) {
    const script = await ScriptsRepo.findById(scriptId);
    if (!script) {
      throw new ResourceNotFoundException('Script', scriptId);
    }
    const watchListToAdd = {
      type: 'script_interested',
      objectId: scriptId,
      user: user._id,
      createdAt: nowDate()
    };
    return await WatchListsRepo.saveOrUpdate(watchListToAdd);
  }

  async removeFromWatchList(scriptId: string, user) {
    const script = await ScriptsRepo.findById(scriptId);
    if (!script) {
      throw new ResourceNotFoundException('Script', scriptId);
    }
    const watchListToDelete = {
      type: 'script_interested',
      objectId: scriptId,
      user: user._id
    };
    return await WatchListsRepo.delete(watchListToDelete);
  }
}

export default new ScriptService();
