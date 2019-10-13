export default {
  server: {
    port: process.env.SERVER_PORT || 3000
    // exposedHost: process.env.SERVER_EXPOSED_HOST,
    // exposedPort: process.env.SERVER_EXPOSED_PORT,
  },
  eventDateFormatParse: 'YYYY-MM-DD HH:mm:ss.SSSZ',
  sms: {
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
      'commissionDetails'
    ],
    templates: {
      event_created: {
        shop:
          '【不咕咕】<shopName>，<hostName>（<hostWechatId>）发起《<scriptName>》[<startTime>]拼团。请①添加TA的微信；②捎上不咕咕客服（booboy）建群完成支付；③在<hostName>的努力下，你会陆续收到参团人信息，请将他们拉入群中支付直至锁场。记得更新不咕咕的拼团信息，保证顺利成团。',
        host:
          '【不咕咕】<hostName>，你发起的<shopName>《<scriptName>》[<startTime>]已发布。①店家会添加你和其他小伙伴微信，请记住店家微信[微信号]；②你需要将支付情况在不咕咕上更新（支付之后才会不咕咕）；③拼团成功后店家会按照此次规则返现（通过不咕咕才能获得返现）。'
      },
      event_joined: {
        shop: '【不咕咕】<participatorName>（<participatorWechatId>）想加入《<scriptName>》[<startTime>]，请将TA拉至活动群完成支付，并同步给该场<hostName>（<hostWechatId>）。',
        host: '【不咕咕】<hostName>，一名新玩伴想参加<shopName>《<scriptName>》[<startTime>]，店家会将TA拉入活动群，请追踪支付情况并更新至不咕咕。',
        participator: '【不咕咕】<participatorName>，欢迎加⼊入<shopName>《<scriptName>》[<startTime>]，店家将会添 加你的微信完成⽀支付。请记住店家微信[<shopWechatId>]。'
      },
      event_completed: {
        shop:
          '【不咕咕】拼团成功！<shopName>，《<scriptName>》[<startTime>]拼团成功，请锁场！感谢<hostName>（微信号）的辛勤组团，根据不咕咕返现规则，您需要依次返现给<commissionDetails> 若有疑问，请联系不咕咕官方微信。',
        host: '不咕咕】<hostName>，<shopName>《<scriptName>》[<startTime>]拼团成功！根据本场返现规则，店家将返回给您xxx元。若有疑问，请联系不咕咕官方微信。',
        participator: '【不咕咕】<participatorName>，<shopName>《<scriptName>》[<startTime>]拼团成功！根据本场返现规则，商家将返回给您xx元。若有疑问，请联系不咕咕官方微信。'
      }
    }
  }
};
