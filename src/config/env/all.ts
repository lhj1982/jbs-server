export default {
  server: {
    port: process.env.SERVER_PORT || 3000
    // exposedHost: process.env.SERVER_EXPOSED_HOST,
    // exposedPort: process.env.SERVER_EXPOSED_PORT,
  },
  eventDateFormatParse: 'YYYY-MM-DD HH:mm:ss.SSSZ',
  notification: {
    url: 'https://detail.boogoogoo.com?<eventId>',
    placeholders: [
      'shopName',
      'hostName',
      'hostWechatId',
      'scriptName',
      'startTime',
      'participatorName',
      'participatorWechatId',
      'shopWechatId',
      'hostCommission',
      'participatorCommission',
      'commissionDetails',
      'url'
    ],
    // 【不咕咕】欲望之城实景侦探剧本演绎推理馆（静安店），阿呆拉·布鲁/adelablue 发起《古堡》2019-10-16 14:30拼团。请①联系TA；②捎上不咕咕小boo建立当场群；③在阿呆拉·布鲁的努力下，你会陆续收到参团人信息，请将他们拉入直至锁场。记得同步信息给阿呆拉·布鲁，让TA更新不咕咕场次。
    // 【不咕咕】[发起人]，你发起的[店家名]《剧本》[具体时间]已发布。①TA家[微信号]会联系你和其他小伙伴；②你需要同步状态到不咕咕；③拼团成功后会按规则处理。要加油分享哦，祝组团成功！
    // 【不咕咕】拼团成功！[店家名]，《剧本》[具体时间]拼团成功，请锁场！感谢[发起人]（微信号）的辛勤组团，根据不咕咕规则，您需要依次给①[发起人]（微信号）xxx元；②[参加者]（微信号）xx元；③[参加者]（微信号）xx元；④[参加者]（微信号）xx元；⑤[参加者]（微信号）xx元 若有疑问，请联系不咕咕官方。回T退订
    templates: {
      event_created: {
        shop:
          '【不咕咕】<shopName>，<hostName>（<hostWechatId>）发起《<scriptName>》<startTime>拼团。请①联系TA；②捎上不咕咕小boo建立当场群；③在<hostName>的努力下，你会陆续收到参团人信息，请将他们拉入直至锁场。记得同步信息给<hostName>，让TA更新不咕咕场次。',
        host:
          '【不咕咕】<hostName>，你发起的<shopName>《<scriptName>》<startTime>已发布。①TA家<shopWechatId>会联系你和其他小伙伴；②你需要同步状态到不咕咕；③拼团成功后会按规则处理。要加油分享哦，祝组团成功！'
      },
      event_joined: {
        // 【不咕咕】[参与人]/[参与人微信号] 想加入《剧本》[具体时间]，请将TA拉至活动群，并同步状态给发起人[发起人]/发起人微信号。
        shop: '【不咕咕】<participatorName>（<participatorWechatId>）想加入《<scriptName>》<startTime>，请将TA拉至活动群，并同步状态给发起人<hostName>（<hostWechatId>）。'
        // host: '【不咕咕】<hostName>，一名新玩伴想参加<shopName>《<scriptName>》[<startTime>]，店家会将TA拉入活动群，请追踪支付情况并更新至不咕咕。',
        // participator: '【不咕咕】<participatorName>，欢迎加⼊入<shopName>《<scriptName>》[<startTime>]，店家将会添 加你的微信完成⽀支付。请记住店家号[<shopWechatId>]。'
      },
      event_completed: {
        shop:
          '【不咕咕】拼团成功！<shopName>，《<scriptName>》<startTime>拼团成功，请锁场！感谢<hostName>（<hostWechatId>）的辛勤组团，根据不咕咕规则，您需要依次给<commissionDetails> 若有疑问，请联系不咕咕官方。'
        // host: '不咕咕】<hostName>，<shopName>《<scriptName>》<startTime>拼团成功！根据本场返现规则，店家将返回给您xxx元。若有疑问，请联系不咕咕官方微信。',
        // participator: '【不咕咕】<participatorName>，<shopName>《<scriptName>》<startTime>拼团成功！根据本场返现规则，商家将返回给您xx元。若有疑问，请联系不咕咕官方微信。'
      }
    },
    smsTemplates: {
      event_created: {
        shop: '【不咕咕】<shopName>，有人发起《<scriptName>》<startTime>拼团，请与TA尽早确认时间，查看<url>',
        host: '【不咕咕】<hostName>，你发起的<shopName>《<scriptName>》<startTime>已发布。请按照小程序内提示操作。'
      },
      event_joined: {
        shop: '【不咕咕】有新的参与者想要加入《<scriptName>》<startTime>，请查看<url>。'
        // host: '【不咕咕】<hostName>，一名新玩伴想参加<shopName>《<scriptName>》[<startTime>]，店家会将TA拉入活动群，请追踪支付情况并更新至不咕咕。',
        // participator: '【不咕咕】<participatorName>，欢迎加⼊入<shopName>《<scriptName>》[<startTime>]，店家将会添 加你的微信完成⽀支付。请记住店家号[<shopWechatId>]。'
      },
      // 【不咕咕】拼团成功！[店家名]《剧本》[具体时间]拼团成功！请查看 boogoogoo/xxxxxxxxx 并按规则操作！
      event_completed: {
        shop: '【不咕咕】拼团成功！<shopName>，《<scriptName>》<startTime>拼团成功！请查看<url> 并按规则操作！'
        // host: '不咕咕】<hostName>，<shopName>《<scriptName>》<startTime>拼团成功！根据本场返现规则，店家将返回给您xxx元。若有疑问，请联系不咕咕官方微信。',
        // participator: '【不咕咕】<participatorName>，<shopName>《<scriptName>》<startTime>拼团成功！根据本场返现规则，商家将返回给您xx元。若有疑问，请联系不咕咕官方微信。'
      }
    }
  }
};
