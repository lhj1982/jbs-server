import * as mongoose from 'mongoose';
import { GameSchema } from '../models/game.model';
import { CommonRepo } from './common.repository';
import * as moment from 'moment';
const Game = mongoose.model('Game', GameSchema, 'games');

mongoose.set('useFindAndModify', false);

class GamesRepo extends CommonRepo {
  async getSession() {
    return super.getSession(Game);
  }

  async endSession() {
    super.endSession();
  }

  async findById(id: string, extras = []) {
    if (extras.indexOf('rundowns') != -1) {
      return await Game.findById(mongoose.Types.ObjectId(id))
        .populate('players')
        .populate({
          path: 'script',
          populate: {
            path: 'rundowns'
          }
        })
        .populate('shop')
        .populate('hostUser')
        .populate('scriptClues')
        .exec();
    } else {
      return await Game.findById(mongoose.Types.ObjectId(id))
        .populate('players')
        .populate({
          path: 'script'
        })
        .populate('shop')
        .populate('hostUser')
        .populate('scriptClues')
        .exec();
    }
  }

  async saveOrUpdate(game, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { shop, script, startTime, endTime, hostUser, status, createdAt } = game;
    return await Game.findOneAndUpdate({ shop, script, startTime, status, hostUser }, game, options).exec();
  }
}

export default new GamesRepo();
