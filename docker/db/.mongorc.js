rs.slaveOk()

config={
    _id : 'rs0',
    protocolVersion: 1,
    members: [
      { _id : 0, host : "mongo0:27017", priority: 10 },
      { _id : 1, host : "mongo1:27017", arbiterOnly: true },
      { _id : 2, host : "mongo2:27017", priority: 9 }
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