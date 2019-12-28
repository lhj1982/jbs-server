// Get commission about for given user
// userId: 5db2668fe56cbc1db0355bb1
const candidateUserId = '5db2668fe56cbc1db0355bb1';
const commissionsArr = db.eventCommissions.find({}).projection({}).sort({
  _id: -1
});
// console.log(commissions.length());
let hostAmounts = 0;
let participatorAmounts = 0;
// console.log(commissionsArr);
commissionsArr.forEach(_ => {
  const {
    commissions
  } = _;
  // console.log(commissions);
  const {
    host: {
      user,
      amount: hostAmount
    },
    participators
  } = commissions;
  const srcUserId = user + "";
  // console.log(user+"" + ", " + candidateUserId);
  if (srcUserId === candidateUserId) {
    hostAmounts += hostAmount;
  }
  participators.forEach(_ => {
    const {
      user,
      amount: participatorAmount
    } = _;
    const srcUser = user + "";
    if (srcUser === candidateUserId) {
      participatorAmounts += participatorAmount;
    }
  });
});
console.log(hostAmounts);
console.log(participatorAmounts);

///////////////////////////////////////////////////////////////////////////////
// Find orders by given event
// 
db.orders.aggregate([{
  $addFields: {
    convertedObjectId: {
      $toObjectId: "$objectId"
    }
  },
}, {
  $lookup: {
    from: "eventUsers",
    localField: "convertedObjectId",
    foreignField: "_id",
    as: "booking"
  }
}, {
  $unwind: {
    path: "$booking",
    preserveNullAndEmptyArrays: true
  }
}, {
  $lookup: {
    from: "events",
    localField: "booking.event",
    foreignField: "_id",
    as: "eventObj"
  }
}, {
  $unwind: {
    path: "$eventObj",
    preserveNullAndEmptyArrays: true
  }
}, {
  $lookup: {
    from: "refunds",
    localField: "_id",
    foreignField: "order",
    as: "refunds"
  }
}, {
  $match: {
    "booking.event": ObjectId("5df450fe0c4f4618d47fe74f")
  }
}, {
  $sort: {
    createdAt: -1
  }
}]);
///////////////////////////////////////////////////////////////////////////////
// Find orders by given shop
db.orders.aggregate([{
  $addFields: {
    convertedObjectId: {
      $toObjectId: "$objectId"
    }
  },
}, {
  $lookup: {
    from: "eventUsers",
    localField: "convertedObjectId",
    foreignField: "_id",
    as: "booking"
  }
}, {
  $unwind: {
    path: "$booking",
    preserveNullAndEmptyArrays: true
  }
}, {
  $match: {
    "booking.event": ObjectId("5df450fe0c4f4618d47fe74f")
  }
}, {
  $sort: {
    createdAt: -1
  }
}]);

///////////////////////////////////////////////////////////////////////////////
// Get events by shop
const shop = db.shops.findOne({_id: ObjectId("5dc52234ecf4b3205fbe6669")});
const {scripts} = shop;
const fromDate = '2019-12-09';
const toDate = '2019-12-16';
const events = db.events.aggregate([
    {
        $match: {
            script: {$in: scripts}, 
            price: {$gt: 10}, 
            status: 'completed', 
            startTime: {$gte: new Date(fromDate)}, endTime: {$lte: new Date(toDate)}
        },
    },
    {
        $lookup: {
            from: 'scripts',
            localField: 'script',
            foreignField: '_id',
            as: 'scriptObj'
        }
    },
    {
        $unwind: {
            path: '$scriptObj',
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $sort: {
            startTime: 1
        }
    },
    {
        $project: { startTime: 1, endTime: 1, price: 1, createdAt: 1, "scriptObj.name": 1 }
    }
]);


// const events = db.events.find({script: {$in: scripts}, status: 'completed', startTime: {$gte: new Date(fromDate)}, endTime: {$lte: new Date(toDate)}}).count();
// scripts.forEach(_=>{
    
//     db.events.find({script: ObjectId(_)}).pretty();
// });



console.log(events;

