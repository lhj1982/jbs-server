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
  $match: {
    "booking.event": ObjectId("5df450fe0c4f4618d47fe74f")
  }
}, {
  $sort: {
    createdAt: -1
  }
}]);
///////////////////////////////////////////////////////////////////////////////

