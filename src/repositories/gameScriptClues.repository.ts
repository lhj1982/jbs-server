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

  async find(params) {
    return await GameScriptClue.find(params).exec();
  }

  // async findByGameAndScriptClue(gameId: string, scriptClueId: string, playerId: string) {
  //   return await GameScriptClue.findOne({
  //     game: gameId,
  //     scriptClue: scriptClueId,
  //     owner: playerId
  //   }).exec();
  // }

  async findGameScriptCluesByPlayerId(gameId: string, playerId: string) {
    return await GameScriptClue.find({
      game: gameId,
      owner: playerId
    })
      .populate('game')
      .populate({
        path: 'scriptClue'
      })
      .exec();
  }

  async saveOrUpdate(gameScriptClue, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id, scriptClue, game, owner } = gameScriptClue;
    if (_id) {
      return await GameScriptClue.findOneAndUpdate({ _id }, gameScriptClue, options).exec();
    } else {
      return await GameScriptClue.findOneAndUpdate({ scriptClue, game, owner }, gameScriptClue, options).exec();
    }
  }
}

export default new GameScriptCluesRepo();
