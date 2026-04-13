const pool = require("../db");

// const user = {
//   id: 1,
//   // username: "manuel",
//   email: "manuel@gmail.com",
//   password: "123",
//   role: "admin",
//   privileges: ["read_profile"],
//   tempSecret: {
//     base32: "JBSWY3DPEHPK3PXP",
//   },
//   secret: null,
// };

// const adminUser = {
//   _id: "admin1",
//   role: "admin",
//   password: "123",
// };

// const coordinatorAllowed = {
//   _id: "coord1",
//   role: "coordinator",
//   password: "123",
// };

// const coordinatorDenied = {
//   _id: "coord2",
//   role: "coordinator",
//   password: "123",
// };

// const resource = {
//   coordinators: ["coord1", "coord3"],
// };

/**
 * @param {string} email
 * @returns {Promise<{ employeeid: string, email: string, pwd: string, name: string, role: string } | undefined>}
 */
async function findEmployeeByEmail(email) {
  const { rows } = await pool.query(
    `SELECT e.employeeid, e.email, e."Password" AS pwd, e."Name" AS name, r."Name" AS role,
    e.isactive, e.hasfirstlogin, e.totpsecret, e.roleid, e.failedloginattempts, e.blockeduntil,
    e.temptotpsecret, e.temptotpsecretcreatedat
    FROM public.employee e
    INNER JOIN public.role r ON r.roleid = e.roleid
    WHERE LOWER(TRIM(e.email)) = LOWER(TRIM($1))`,
    [email],
  );
  return rows[0];
}

async function getEmployeeById(employeeid) {
  const { rows } = await pool.query(
    `SELECT e.employeeid, e.email, e."Password" AS pwd, e."Name" AS name, e.roleid, r."Name" AS role,
    e.isactive, e.hasfirstlogin, e.totpsecret, e.temptotpsecret, e.temptotpsecretcreatedat,
    e.failedloginattempts, e.blockeduntil
    FROM public.employee e
    INNER JOIN public.role r ON r.roleid = e.roleid
    WHERE e.employeeid = $1`,
    [employeeid],
  );
  return rows[0];
}

async function updatePassword(employeeid, newPassword) {
  await pool.query(
    `UPDATE public.employee SET "Password" = $1 WHERE employeeid = $2`,
    [newPassword, employeeid],
  );
}

async function setFirstLogin(employeeid, hasFirstLogin) {
  await pool.query(
    `UPDATE public.employee SET hasfirstlogin = $1 WHERE employeeid = $2`,
    [hasFirstLogin, employeeid],
  );
}

async function incrementFailedAttempts(employeeid) {
  const {rows} = await pool.query(
    `UPDATE public.employee SET failedloginattempts = COALESCE(failedloginattempts, 0) + 1 WHERE employeeid = $1
    RETURNING failedloginattempts`,
    [employeeid],
  );
  return rows[0]?.failedloginattempts ?? 0;
}

async function resetFailedAttempts(employeeid) {
  await pool.query(
    `UPDATE public.employee SET failedloginattempts = 0 WHERE employeeid = $1`,
    [employeeid],
  );
}

async function setBlockedUntil(employeeid, blockedUntil) {
  const { rows } = await pool.query(
    `UPDATE public.employee SET blockeduntil = $1 WHERE employeeid = $2
    RETURNING employeeid, blockeduntil`,
    [blockedUntil, employeeid],
  );
  return rows[0];
}

async function clearBlockedUntil(employeeid) {
  const { rows } = await pool.query(
    `UPDATE public.employee SET blockeduntil = NULL WHERE employeeid = $1
    RETURNING employeeid, blockeduntil`,
    [employeeid],
  );
  return rows[0];
}

async function clearLoginSecurityState(employeeid) {
  await pool.query(
    `UPDATE public.employee SET failedloginattempts = 0, blockeduntil = NULL WHERE employeeid = $1`,
    [employeeid],
  );
}

// temporal porque solo funciona cuando employee existe
async function createLog(employeeid, description, ipAddress) {
  await pool.query(
    `INSERT INTO public.logs (logid, employeeid, moment, description, ip_address)
    VALUES (gen_random_uuid(), $1, NOW(), $2, $3)`,
    [employeeid, description, ipAddress],
  );
}

async function createLogThrottled(employeeid, description, ipAddress, windowMinutes = 5) {
  const { rows } = await pool.query(
    `SELECT 1
    FROM public.logs
    WHERE employeeid = $1
    AND description = $2
    AND ip_address = $3
    AND moment >= NOW() - ($4::text || ' minutes')::interval
    LIMIT 1`,
    [employeeid, description, ipAddress, String(windowMinutes)],
  );

  if (rows.length > 0) {
    return { inserted: false };
  }

  await pool.query(
    `INSERT INTO public.logs (logid, employeeid, moment, description, ip_address)
    VALUES (gen_random_uuid(), $1, NOW(), $2, $3)`,
    [employeeid, description, ipAddress],
  );

  return { inserted: true };
}

async function saveTempTotpSecret(employeeid, secret) {
  await pool.query(
    `UPDATE public.employee SET temptotpsecret = $1, temptotpsecretcreatedat = NOW() WHERE employeeid = $2`,
    [secret, employeeid],
  );
}

async function clearTempTotpSecret(employeeid) {
  await pool.query(
    `UPDATE public.employee SET temptotpsecret = NULL, temptotpsecretcreatedat = NULL WHERE employeeid = $1`,
    [employeeid],
  );
}

async function activateTempTotpSecret(employeeid) {
  await pool.query(
    `UPDATE public.employee
    SET totpsecret = temptotpsecret, temptotpsecret = NULL, temptotpsecretcreatedat = NULL
    WHERE employeeid = $1`,
    [employeeid],
  );
}

module.exports = {
  findEmployeeByEmail,
  updatePassword,
  setFirstLogin,
  incrementFailedAttempts,
  resetFailedAttempts,
  setBlockedUntil,
  clearLoginSecurityState,
  getEmployeeById,
  saveTempTotpSecret,
  createLog,
  clearTempTotpSecret,
  activateTempTotpSecret,
  clearBlockedUntil,
  createLogThrottled
};
