import * as mongoose from 'mongoose';
import { escapeRegex } from '../utils/stringUtil';
import { ScriptSchema } from '../models/script.model';
import { DiscountRuleMapSchema } from '../models/discountRuleMap.model';
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
    let condition = {};
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), 'gi');
      condition = {
        $or: [{ name: regex }, { description: regex }, { tags: keyword }]
      };
    }
    // console.log(condition);
    const total = await Script.countDocuments(condition).exec();
    const pagination = { offset, limit, total };
    const pagedScripts = await Script.find(condition)
      .populate('shops')
      .populate('discountRuleMap')
      .skip(offset)
      .limit(limit)
      .exec();
    return { pagination, data: pagedScripts };
  }

  async findOne(params) {
    return await Script.where(params)
      .findOne()
      .exec();
  }

  async findByDiscountRule(discountRule) {
    const { _id } = discountRule;
    const discountRulesMap = await DiscountRuleMap.find({ discountRule: _id })
      .populate({
        path: 'shop',
        populate: {
          path: 'scripts'
        }
      })
      .populate('discountRule')
      .populate({
        path: 'script',
        populate: [{ path: 'shops' }, { path: 'events' }]
      })
      .exec();
      // console.log(discountRulesMap);
    
    let scripts =  [];

    for (let i=0; i<discountRulesMap.length; i++) {
      const discountRuleMap = discountRulesMap[i];
      const {script, shop: {scripts: scriptsInShop}} = discountRuleMap;
      if (script) {
        scripts.push(script);
      }
      if (scriptsInShop && scriptsInShop.length>0) {
        scripts = [...scripts, ...scriptsInShop];
      }
    }
    // discountRulesMap.map(_ => {
    //   const {shop: {scripts}} = _;
    //   return scripts;
    // });
    // console.log(typeof discountInShopScripts);
    // console.log(discountInShopScripts.flat());

    // const discountInScripts =  discountRulesMap.map(_ => {
    //   return _.script;
    // }).filter(_=>{return _!=null});

    // console.log(scripts);
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
