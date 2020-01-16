db.scripts.find({name: {$regex: '青衣怪谈1'}})
   .projection({})
   .sort({_id:-1})
   .limit(100)


db.shops.find({scripts: {$all: [ObjectId('5de9f3871b9c9219204fc921')]}})
   
db.events.find({script: ObjectId('5df345984fb6d42028ebc539')})

db.priceWeeklySchema.find({script: ObjectId('5de0e991f4a6862a597ce071')})


const scriptIdToAdd = ObjectId('5dccc220dca3ab62d3f7eb62');   
const scriptIdToRemove = ObjectId('5da1f1bfdcf0010e2a3637b1');


// db.watchLists.find({type: 'script_interested', objectId: scriptIdToAdd.str});

// const session = db.getMongo().startSession({retryWrites: true, causalConsistency: true}).getDatabase(db.getName());
const session = db.getMongo().startSession( { readPreference: { mode: "primary" } } );
session.startTransaction( { readConcern: { level: "local" }, writeConcern: { w: "majority" } } );

const eventsCol = session.getDatabase("jbs").events;
const shopsCol = session.getDatabase("jbs").shops;
const scriptsCol = session.getDatabase("jbs").scripts;
const watchListsCol = session.getDatabase("jbs").watchLists;
const priceWeeklySchemaCol = session.getDatabase("jbs").priceWeeklySchema;

try {
    let scriptKeyToAdd = undefined;
    scriptsCol.find({_id: scriptIdToAdd}).forEach(_=>{
        const {key} = _;
        scriptKeyToAdd = key;
    });
    // db.shops.find({scripts: {$all: [scriptIdToRemove]}});
    db.shops.find({scripts: {$all: [scriptIdToRemove]}}).forEach(shop => {
       const {scripts, _id} = shop;
       // update event
       eventsCol.find({shop: ObjectId(_id), script: scriptIdToRemove}).forEach(event=>{
           const {_id: eventId} = event;
        //   console.log(event);
        eventsCol.find({_id: ObjectId(eventId)}).forEach(_=>{
            // console.log('found');
            eventsCol.update({_id: ObjectId(eventId)}, {$set: {script: scriptIdToAdd}});
        });
       });
      
      // update script shop price schema
      priceWeeklySchemaCol.find({script: scriptIdToRemove}).forEach(_ => {
          const {createdAt, updatedAt, priceSchema, shop, shopKey} = _;
          const priceSchemaToAdd = {createdAt, updatedAt, priceSchema, shop, shopKey, script: scriptIdToAdd, scriptKey: scriptKeyToAdd};
          priceWeeklySchemaCol.insert(priceSchemaToAdd);
      });
       
      // update watch list
      watchListsCol.find({type: 'script_interested', objectId: scriptIdToRemove.str}).forEach(watchList => {
          const {_id} = watchList;
        //   console.log(watchList); 
          watchListsCol.update({_id: ObjectId(_id)}, {$set: {objectId: scriptIdToAdd.str}});
      });
       
      const newScripts = scripts.filter(_=>{
        //   console.log(_.toString() + ', ' + scriptIdToRemove.toString());
          return !scriptIdToRemove.equals(_);
      });
      newScripts.push(scriptIdToAdd);
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
