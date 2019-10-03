# Setup

## Install

```
nodejs

npm install typescript -g
```

Mongodb

https://linuxize.com/post/how-to-install-mongodb-on-centos-7/

to be able to use transactions, we have to install mongodb rs, more info can be found here
https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a/51462024
```
npm install run-rs -g
run-rs -v 4.0.10 --shell
```


Docker with replica set on Docker

https://37yonub.ru/articles/mongo-replica-set-docker-localhost

don't forget to add mongo0 ,mongo1 mongo2 to /etc/hosts file

```
docker-compose up
```

```
config={"_id":"rs0","members":[{"_id":0,"host":"mongo0:27017"},{"_id":1,"host":"mongo1:27017"},{"_id":2,"host":"mongo2:27017"}]}
rs.initiate(config)
```

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