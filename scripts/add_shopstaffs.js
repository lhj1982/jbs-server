const data = [{ 'username': 'Han_Opium', 'key': 'MICITY-pt'},  
 { 'username': 'pansiliang', 'key': 'pdl-pt'},  
 { 'username': 'wxid_k0lwpa97kfp22', 'key': 'mh-hk'},  
 { 'username': 'GGG_PortChief', 'key': 'ggg-xh'},  
 { 'username': 'mosi_club', 'key': 'ms-ja'},  
 { 'username': 'sock_bb', 'key': 'qysws-xh'},  
 { 'username': 'yzrefueling', 'key': '1804-pt'},  
 { 'username': 'chenxuyedetiandi', 'key': 'xmt-pt'},  
 { 'username': 'BettyWu42', 'key': 'xyr-xh'},  
 { 'username': 'QTJBTLS2304', 'key': 'qt-pt'},  
 { 'username': 'mcp0524', 'key': 'kp-ja'},  
 { 'username': 'ChenAce', 'key': 'os-xh'},  
 { 'username': 'miraclehyh716', 'key': 'yyms-pt'},
 { 'username': 'chandler_ain', 'key': 'mmd-hqg'},  
 { 'username': 'bobo518wyb', 'key': 'my-yp'},  
 { 'username': 'Cat_Z5', 'key': '  mxq-bs'},  
 { 'username': 'beexy12345', 'key': 'djjc-hp'},  
 { 'username': 'Nick719208132', 'key': 'yj-xh'},  
 { 'username': 'tingting9022', 'key': 'wts-cn'},  
 { 'username': 'sjg18117428330', 'key': 'sjg-ja'},  
 { 'username': 'FyGod910801', 'key': 'aw-xh'},  
 { 'username': 'ace-zb', 'key': 'ace-zb'},  
 { 'username': 'Moon18918632372', 'key': 'yq-huochezhan'},  
 { 'username': 'Moon15316323212', 'key': 'yq-daxuelu'},  
 { 'username': 'ShameimaruHina', 'key': 'btz-ysl'},  
 { 'username': 'yq-xjh', 'key': 'yq-xjh'},  
 { 'username': 'mooncake_shu', 'key': 'kami-sxbl'},  
 { 'username': 'wxid_ahvox5u8qffg52', 'key': 'mi-huanqiugang'},  
 { 'username': 'ace-ja', 'key': 'ace-ja'},  
 { 'username': 'bboyLuigi', 'key': 'ssxs-hpnl'},  
 { 'username': 'wxid_ahvox5u8qffg52', 'key': 'mi-ja'},  
 { 'username': 'Moon17625238939', 'key': 'yq-ja'},  
 { 'username': 'ace-rm', 'key': 'ace-rm'},  
 { 'username': 'Moon18001601840', 'key': 'yq-rg'},  
 { 'username': 'Moon15316790176', 'key': 'yq-huaihaizhonglu'},  
 { 'username': 'ace-hk', 'key': 'ace-hk'},  
 { 'username': 'ShameimaruHina', 'key': 'btz-cn'},  
 { 'username': 'ace-tsl', 'key': 'ace-tsl'}];
// const data = [{ 'username': 'Han_Opium', 'key': 'MICITY-pt'}];
const shopKeys = data.map(_=>_.key);
const usernameKeys = data.map(_=>_.username);
const roles = [ObjectId('5da33b6c78dc3d815895803b')];

// create user
const insertQuery = data.map(_=>{
   const {username} = _;
   const cursor = db.users.find({username});
   const user = cursor.hasNext() ? cursor.next() : null;
   if (user) {
       return undefined;
   } else {
       return {username, password: '$2b$10$XDWUIn9PCkAsSRBA1ffP0eGgOjUKG79viFeHOlO1LJhxy12ZGSSUW', status: 'active', roles };
   }
}).filter(_=>{return typeof _ !== 'undefined'});
// console.log(insertQuery);

db.users.insertMany(insertQuery);

const insertShopStaffQuery = data.map(_=>{
    const {username, key} = _;
    const shopCursor = db.shops.find({key});
    const shop = shopCursor.hasNext() ? shopCursor.next() : null;
    const userCursor = db.users.find({username});
    const user = userCursor.hasNext() ? userCursor.next() : null;
    if (user && shop) {
        return {
            user: user._id,
            shop: shop._id,
            createdAt: new Date()
        }
    } else {
        return undefined;
    }
}).filter(_=>{return typeof _ !== 'undefined'});

// console.log(insertShopStaffQuery);

db.shopStaffs.insertMany(insertShopStaffQuery);