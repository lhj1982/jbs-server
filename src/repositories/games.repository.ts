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

  async find(params, filter = { status: ['ready'], availableSpots: -1 }, sort = undefined) {
    const { status, availableSpots } = filter;
    const { offset, limit, keyword, scriptId, shopId } = params;
    const condition = {
      status: { $in: status }
    };
    if (scriptId) {
      condition['script'] = scriptId;
    }
    if (shopId) {
      condition['shop'] = shopId;
    }
    let sortObj = { startTime: 1 };
    if (sort) {
      sortObj = Object.assign({}, sort);
    }
    let pagination = undefined;
    let pagedGames = [];
    let games = await Game.find(condition)
      .populate('players')
      .populate({
        path: 'script'
      })
      .populate('shop')
      .populate('hostUser')
      .sort(sortObj)
      .exec();
    games = games.filter(event => {
      const { script, shop } = event;
      return script != null && shop != null;
    });
    pagination = { offset, limit, total: games.length };
    pagedGames = games.slice(offset, offset + limit);
    return { pagination, data: pagedGames };
  }

  // async findByUser(userId: string) {
  //   return await Game.find({ hostUser: userId })
  //     .populate('players')
  //     .populate({
  //       path: 'script'
  //     })
  //     .populate('shop')
  //     .populate('hostUser')
  //     .sort({ createdAt: -1 })
  //     .exec();
  // }

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
        .exec();
    } else {
      return await Game.findById(mongoose.Types.ObjectId(id))
        .populate('players')
        .populate({
          path: 'script'
        })
        .populate('shop')
        .populate('hostUser')
        .exec();
    }
  }

  async findByParams(params) {
    return await Game.find(params)
      .populate('players')
      .populate({
        path: 'script',
        populate: [
          {
            path: 'rundowns',
            select: '-rundown'
          },
          {
            path: 'clueFilters'
          }
        ]
      })
      .populate('shop')
      .populate('hostUser')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findUnique(params) {
    return await Game.findOne(params).exec();
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
