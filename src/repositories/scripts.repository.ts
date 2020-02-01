import * as mongoose from 'mongoose';
import { escapeRegex } from '../utils/stringUtil';
import { ScriptSchema } from '../models/script.model';
import { DiscountRuleMapSchema } from '../models/discountRuleMap.model';
import ShopsRepo from '../repositories/shops.repository';
const Script = mongoose.model('Script', ScriptSchema);
const DiscountRuleMap = mongoose.model('DiscountRuleMap', DiscountRuleMapSchema, 'discountRulesMap');
mongoose.set('useFindAndModify', false);

class ScriptsRepo {
  async findById(id: string) {
    // console.log('script ' + mongoose.Types.ObjectId.isValid(id));
    return await Script.findById(mongoose.Types.ObjectId(id))
      .populate('shops')
      .populate({
        path: 'events',
        match: { status: { $in: ['ready'] } },
        populate: {
          path: 'hostUser',
          select: 'nickName avatarUrl gender country province city language mobile wechatId ageTag'
        },
        options: { sort: { startTime: -1 } }
      })
      .populate('discountRuleMap')
      .exec();
  }

  async find(params) {
    const { offset, limit, keyword } = params;
    let condition = { status: 'online' };
    let shopCondition = {};
    if (keyword) {
      const shops = await ShopsRepo.find({ offset: 0, limit: 100, keyword });
      const {
        pagination: { total },
        data
      } = shops;
      // console.log(shops);
      const shopIds = data.map(_ => _._id);
      // if no shop info found, search script name, desc and tags

      if (shopIds.length === 0) {
        const regex = new RegExp(escapeRegex(keyword), 'gi');
        condition = Object.assign(condition, {
          $or: [{ name: regex }, { tags: keyword }]
        });
      } else {
        shopCondition = {
          _id: { $in: shopIds }
        };
      }
    }
    // console.log(condition);
    const rawScripts = await Script.find(condition)
      .populate({
        path: 'shops',
        match: shopCondition
      })
      .populate('discountRuleMap')
      .sort({ priority: -1, key: 1 })
      .exec();

    const filteredScripts = rawScripts.filter(_ => {
      const { shops } = _;
      return shops.length > 0;
    });
    const total = filteredScripts.length;
    const pagination = { offset, limit, total };
    const pagedScripts = filteredScripts.slice(offset, offset + limit);
    return { pagination, data: pagedScripts };
  }

  async findOne(params) {
    return await Script.where(params)
      .findOne()
      .exec();
  }

  /**
   * Find all scripts by given discount rules.
   * It can be a rule applied directly on a script or scripts belongs to a shop which applies a certain rule.
   *
   * @param {[type]} discountRule [description]
   */
  async findByDiscountRules(discountRules) {
    const ids = discountRules.map(_ => _._id);
    const discountRulesMap = await DiscountRuleMap.find({
      discountRule: { $in: ids }
    })
      .populate({
        path: 'shop',
        populate: {
          path: 'scripts',
          populate: [{ path: 'shops' }]
        }
      })
      .populate('discountRule')
      .populate({
        path: 'script',
        populate: [{ path: 'shops' }, { path: 'events' }]
      })
      .exec();
    // console.log(discountRulesMap);

    let scripts = [];
    for (let i = 0; i < discountRulesMap.length; i++) {
      const discountRuleMap = discountRulesMap[i];
      const {
        script,
        shop: { scripts: scriptsInShop }
      } = discountRuleMap;
      if (script) {
        scripts.push(script);
      }
      if (scriptsInShop && scriptsInShop.length > 0) {
        scripts = [...scripts, ...scriptsInShop];
      }
    }
    return scripts;
  }

  async saveOrUpdate(script) {
    const options = {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      returnNewDocument: true
    };
    return await Script.findOneAndUpdate({ key: script.key }, script, options).exec();
  }
}
export default new ScriptsRepo();
