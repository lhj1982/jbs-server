rs.slaveOk()

config={
    _id : 'rs0',
    members: [
      { _id : 0, host : "3.112.182.171:27017" },
      { _id : 1, host : "3.112.182.171:27018" },
      { _id : 2, host : "3.112.182.171:27019" }
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