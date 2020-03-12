import * as mongoose from 'mongoose';
import { GameScriptClueSchema } from '../models/gameScriptClue.model';
import { CommonRepo } from './common.repository';
const GameScriptClue = mongoose.model('GameScriptClue', GameScriptClueSchema, 'gameScriptClues');

mongoose.set('useFindAndModify', false);

class GameScriptCluesRepo extends CommonRepo {
  async getSession() {
    return super.getSession(GameScriptClue);
  }

  async endSession() {
    super.endSession();
  }

  async saveOrUpdate(gameScriptClue, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { scriptClue, game } = gameScriptClue;
    return await GameScriptClue.findOneAndUpdate({ scriptClue, game }, gameScriptClue, options).exec();
  }
}

export default new GameScriptCluesRepo();
