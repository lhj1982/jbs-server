# Setup

## Install

### Node and TypeScript
```
install nodejs with nvm

npm install typescript -g
```

### Mongodb

https://linuxize.com/post/how-to-install-mongodb-on-centos-7/

to be able to use transactions, we have to install mongodb rs, more info can be found here
https://stackoverflow.com/questions/51461952/mongodb-v4-0-transaction-mongoerror-transaction-numbers-are-only-allowed-on-a/51462024
```
npm install run-rs -g
run-rs -v 4.0.10 --shell
```

#### Install mongodb replica with docker

https://blog.csdn.net/biao0309/article/details/87641272

1. 
```
openssl rand -base64 756 > mongodb.key
chmod 400 mongodb.key
```

2. 
```
docker-compose up
```

3. Login with authentication
```
config={"_id":"rs0","members":[{"_id":0,"host":"192.168.0.102:27017"},{"_id":1,"host":"192.168.0.102:27017"},{"_id":2,"host":"192.168.0.102:27017"}]}
rs.initiate(config)
```

rs.reconfig(config,{force: true});

Don't forget to replace ip addresses with the real one


Enable authentication

https://medium.com/mongoaudit/how-to-enable-authentication-on-mongodb-b9e8a924efac



### Install docker and docker composer on EC2 AMI

```
sudo curl -L https://github.com/docker/compose/releases/download/1.21.0/docker-compose-`uname -s`-`uname -m` | sudo tee /usr/local/bin/docker-compose > /dev/null

sudo chmod +x /usr/local/bin/docker-compose

ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose


https://serverfault.com/questions/836198/how-to-install-docker-on-aws-ec2-instance-with-ami-ce-ee-update
```


### Install Redis

Redis is used for server side cache.

```
docker run -p 6379:6379 --name jbs-api-redis -d redis redis-server --appendonly yes
```

# Certificate

generate pfx for wechat pay api
```
openssl pkcs12 -export -out client-certificate2.pfx -inkey client1-key.pem -in client1-crt.pem -certfile ca-crt.pem
```

# Orders and Refund

	- An order is created when
		1. A user create an event
		2. A user join an event
	- An order status table
| status      | Description |
| ----------- | ----------- |
| created     | order created, not paid |
| paid        | when system get pay callback from wechat |
| refund      | when the order is refund |
| cancelled   | when the order is cancelled |

	- A user choose to pay, the payment status will be updated in order table
	- A user can choose to cancel an event, when an event is cancelled, the following will happen
		1. Retrieve all user paid bookings for this event
		2. Mark their orders status as refund
		3. Create corresponding refund for those users
	- Refund status
| status      | Description |
| ----------- | ----------- |
| created     | refund created, initial status |
| approved    | admin has to approve refund to be able to process |
| refund      | refund is requested |
| failed      | refund failed according to wechat callback |

	- There is a separate process to iterate all approved refunds
	- When a booking is in refund, the user can rejoin the event, eventually, create new order

# Run

##  Run on local
```
npm run dev:watch
```

## Run on server

```
npm run start:prod:daemon

or 

npm run restart:prod:daemon

or 

npm run start:prod:single
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


# SMS Message

【不咕咕】拼团成功！[13651976276]您好，[十三先生剧情推理实景演绎]的[2019-10-07 14:00]《新台南七号公寓》拼团成功！根据发起人[13651976276]（微信搜索号：[13651976276]）的记录以及不咕咕返现规则，商家将返回给您 20 元，若出现任何问题，请联系不咕咕官方微信【不咕咕上海线下剧本杀组团】！回T退订

# API 

## Error codes

```json
{
	status: 200,
	code: <code>,
	message: <message>,
	data: <data>
}
```

Available error codes:

unauthorized
access_denied
user_not_found
script_not_found
shop_not_found
event_not_found
invalid_request
user_already_exist
shop_already_exist
script_already_exist
event_fully_booked
event_cannot_complete
event_cannot_cancel
user_is_blacklisted
unknown_error

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