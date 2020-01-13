db.scripts.find({name: {$regex: '百匠奇案'}})
   .projection({})
   .sort({_id:-1})
   .limit(100)
   
db.events.find({script: ObjectId('5dd6066c5a6588a77a249572')})

const scriptIdToAdd = ObjectId('5da1f1bfdcf0010e2a363789');   
const scriptIdToRemove = ObjectId('5dd6066c5a6588a77a249572');

// const session = db.getMongo().startSession({retryWrites: true, causalConsistency: true}).getDatabase(db.getName());
const session = db.getMongo().startSession( { readPreference: { mode: "primary" } } );
session.startTransaction( { readConcern: { level: "local" }, writeConcern: { w: "majority" } } );

const eventsCol = session.getDatabase("jbs").events;
const shopsCol = session.getDatabase("jbs").shops;
const scriptsCol = session.getDatabase("jbs").scripts;
const watchListsCol = session.getDatabase("jbs").watchLists;

try {
    // db.shops.find({scripts: {$all: [scriptIdToRemove]}});
    db.shops.find({scripts: {$all: [scriptIdToRemove]}}).forEach(shop => {
       const {scripts, _id} = shop;
       // update event
       eventsCol.find({shop: _id, script: scriptIdToRemove}).forEach(event=>{
           const {_id: eventId} = event;
        //   console.log(event);
        // console.log(typeof eventId);
        eventsCol.find({_id: ObjectId(eventId)}).forEach(_=>{
            // console.log('found');
            eventsCol.update({_id: ObjectId(eventId)}, {$set: {script: scriptIdToAdd}});
        //   console.log(_); 
        });
       });
       
      // update watch list
      watchListsCol.find({type: 'script_interested', objectId: scriptIdToRemove.toString()}).forEach(watchList => {
          const {_id} = watchList;
        //   console.log(watchList); 
          watchListsCol.update({_id: ObjectId(_id)}, {$set: {objectId: scriptIdToAdd.toString()}});
      });
       
      const newScripts = scripts.filter(_=>{
        //   console.log(_.toString() + ', ' + scriptIdToRemove.toString());
          return !scriptIdToRemove.equals(_);
      });
      newScripts.push(scriptIdToAdd);
    //   console.log(newScripts);
      // update shop scripts
      shopsCol.update({_id: ObjectId(_id)}, {$set: {scripts: newScripts}});
    });
    // offline script
    scriptsCol.update({_id: scriptIdToRemove}, {$set: {status: 'offline'}});
} catch (error) {
    session.abortTransaction();
   throw error;
}

session.commitTransaction();
session.endSession();