db.events.aggregate([
    {$match: {status: 'completed', createdAt: {$lte: new Date('2020-01-21T16:26:30.666+08:00')}}}
    ]).forEach(event => {
       const {_id, hostUser} = event;
       // add missing host_event_completed rewards
       const rewardsCusor = db.userRewards.find({type: 'host_event_completed', user: hostUser, objectId: _id.str});
       const reward = rewardsCusor.hasNext() ? rewardsCusor.next() : null;
       if (!reward) {
           const now = new Date();
           db.userRewards.insert({
               type: 'host_event_completed', user: hostUser, objectId: _id.str, points: 50, createdAt: now, updatedAt:now
           })
       }

       // add missing join_event_completed rewards
       db.eventUsers.find({event: _id, status: 'paid'}).forEach(eventUser => {
         const {_id, user} = eventUser;
         const rewardsCusor = db.userRewards.find({type: 'join_event_completed', user: user, objectId: _id.str});
         const reward = rewardsCusor.hasNext() ? rewardsCusor.next() : null;
         
         if (!reward) {
             const now = new Date();
              db.userRewards.insert({
                  type: 'join_event_completed', user: user, objectId: _id.str, points: 15, createdAt: now, updatedAt:now
              })
         }
       });
    });