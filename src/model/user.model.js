const pool = require("../db");
const { PrismaClient } = require('@prisma/client');

const primsa = new PrismaClient();

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

const active2FA = async (id) => {
  const active2FA = await primsa.employee.update({
    where: { employeeid: id },
    data: { hasfirstlogin: true },
  });
  return active2FA;
};

const saveTempSecret = async (id, tempSecret) => {
  const saveTempSecret = await primsa.employee.update({
    where: { employeeid: id },
    data: { totpsecret: tempSecret },
  });
  if (!saveTempSecret) {
    throw new Error("Failed to save temp secret");
  }
};

const findActiveEmployeeById = async (id) => {
  const user = await primsa.employee.findUnique({
    where: { employeeid: id, isactive: true },
    select: { employeeid: true, email: true, Name: true, totpsecret: true },
  });
  return user;
};

module.exports = Object.assign(user, {
  findActiveEmployeeByEmail,
  active2FA,
  saveTempSecret,
  findActiveEmployeeById,
});