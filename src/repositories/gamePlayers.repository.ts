import * as mongoose from 'mongoose';
import { GamePlayerSchema } from '../models/gamePlayer.model';
import { CommonRepo } from './common.repository';
import * as moment from 'moment';
const GamePlayer = mongoose.model('GamePlayer', GamePlayerSchema, 'gamePlayers');

mongoose.set('useFindAndModify', false);

class GamePlayersRepo extends CommonRepo {
  async getSession() {
    return super.getSession(GamePlayer);
  }

  async endSession() {
    super.endSession();
  }

  async findByGameAndPlayerId(gameId: string, playerId: string) {
    return await GamePlayer.findOne({ game: gameId, playerId }).exec();
  }

  async saveOrUpdate(gamePlayer, opt: object = {}) {
    const options = {
      ...opt,
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    const { _id: gameId, game, playerId, user, createdAt } = gamePlayer;
    if (gameId) {
      // await gamePlayer.save();
      // return gamePlayer;
      return await GamePlayer.findOneAndUpdate({ _id: gameId }, gamePlayer, options).exec();
    } else {
      return await GamePlayer.findOneAndUpdate({ game, playerId, createdAt }, gamePlayer, options).exec();
    }
  }
}

export default new GamePlayersRepo();
