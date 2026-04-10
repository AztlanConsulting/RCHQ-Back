const pool = require("../db");

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

/**
 * @param {string} email
 * @returns {Promise<{ employeeid: string, email: string, pwd: string, name: string, role: string } | undefined>}
 */
async function findActiveEmployeeByEmail(email) {
  const { rows } = await pool.query(
    `SELECT e.employeeid, e.email, e."Password" AS pwd, e."Name" AS name, r."Name" AS role
     FROM public.employee e
     INNER JOIN public.role r ON r.roleid = e.roleid
     WHERE LOWER(TRIM(e.email)) = LOWER(TRIM($1)) AND e.isactive = true`,
    [email],
  );
  return rows[0];
}

module.exports = Object.assign(user, {
  findActiveEmployeeByEmail,
});
