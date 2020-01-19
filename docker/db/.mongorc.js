rs.slaveOk()


// localhost
config={
    _id : 'rs0',
    protocolVersion: 1,
    members: [
      { _id : 0, host : "mongo0:27017", priority: 1 },
      { _id : 1, host : "mongo1:27017", priority: 0.5 },
      { _id : 2, host : "mongo2:27017", priority: 0.5 }
    ]
  }


// production
config={
    _id : 'rs0',
    protocolVersion: 1,
    members: [
      { _id : 0, host : "101.133.138.88:27017", priority: 1 },
      { _id : 1, host : "101.133.138.88:27018", priority: 0.5 },
      { _id : 2, host : "101.133.138.88:27019", priority: 0.5 }
    ]
  }

rs.initiate(
  config
)

rs.reconfig(config,{force: true});


db.createUser(
  {
    user: "admin",
    pwd: "a4)`Z'{YbsY+y*)$",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)