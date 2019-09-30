# Setup

## Install

```
nodejs

npm install typescript -g
```

Mongodb

https://linuxize.com/post/how-to-install-mongodb-on-centos-7/


# WXAPP Login

https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html


# DB schema

## import/export collection data
```
mongoimport -d jbs -c users --type json --file users.json 

mongoexport --collection shops --db jbs --out shops.json
```

## update query
```
db.users.update({openId: "opcf_0En_ukxF-NVT67ceAyFWfJw"}, {$set: {roles: [ObjectId("5d7f8cd024f808a2e89d6aec"), ObjectId("5d7f8cc124f808a2e89d6aeb"), ObjectId("5d8f8c1228e1fb01bf80f5cb")]}});
```

## users
```
[{ 
   "_id":"ObjectId(\"5d7db0ac381bf6655915fd9c\")",
   "openId":"1opcf_0En_ukxF-NVT67ceAyFWfJw",
   "__v":{ 
      "$numberInt":"0"
   },
   "city":null,
   "country":null,
   "createdAt":{ 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
   },
   "language":null,
   "nickName":"test1",
   "province":null,
   "roles":[ 
      { 
         "$oid":"5d7f8cd024f808a2e89d6aec"
      }
   ],
   "sessionKey":"OjGsyLrBrvqNUEJcV3LGOg==",
   "unionId":null,
}]

```

## shops

```
[{
	"name": "test",
	"key": "key1",
	"address": "test",
	"mobile": "test",
	"phone": "",
	"contactName": "test",
	"contactMobile": "test",
	"province": "",
	"city": "",
	"district": "虹口区",
	"createdAt": { 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
    },
    "scripts": [ObjectId(\"5d7db0ac381bf6655915fd9c\")]
}]
```

## scripts
```
[{
	"name": "test",
	"key": "key1",
	"description": "test",
	"minNumberOfPersons": 6,
	"maxNumberOfPersons": 10,
	"duration": 240,
	"introImage": "",
	"createdAt":{ 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
    },
    "shops": [ObjectId(\"5d7db0ac381bf6655915fd9c\"), ObjectId(\"5d7db0ac381bf6655915fd9d\")]
}]
```

## pricetemplates
```
[{
	"script": ObjectId(\"5d7db0ac381bf6655915fd9c\"),
    "shop": ObjectId(\"5d7db0ac381bf6655915fd9c\"),
    "price": {
    	"weekdayDayPrice": 100,
	    "weekdayNightPrice": 100,
	    "weekendPrice": 200
	}
}]
```

## events
```
[{
	"startTime": { 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
    },
    "endTime": { 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
    },
    "hostUser": ObjectId(\"5d7db0ac381bf6655915fd9c\"),
    "hostComment": "test",
    price: 100,
	"status": "active",
	"createdAt": { 
      "$date":{ 
         "$numberLong":"1568642805966"
      }
    },
    "script": ObjectId(\"5d7db0ac381bf6655915fd9c\"),
    "shop": ObjectId(\"5d7db0ac381bf6655915fd9c\")
}]
```