const user = {
  id: 1,
  // username: "manuel",
  email: "manuel@gmail.com",
  password: "123",
  role: "admin",
  privileges: ["read_profile"],
  tempSecret: {
    base32: "JBSWY3DPEHPK3PXP",
  },
  secret: null,
};


const adminUser = {
  _id: "admin1",
  role: "admin",
  password: "123",
};

const coordinatorAllowed = {
  _id: "coord1",
  role: "coordinator",
  password: "123",
};

const coordinatorDenied = {
  _id: "coord2",
  role: "coordinator",
  password: "123",
};

const resource = {
  coordinators: ["coord1", "coord3"],
};

module.exports = user;
