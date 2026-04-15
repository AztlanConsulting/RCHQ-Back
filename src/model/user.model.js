const {randomUUID} = require("crypto");
const prisma = require("../prisma");
const { hashIp } = require("../utils/hashIp");
const { LOG_ACTIONS } = require("../utils/logActions");

function mapEmployee(employee) {
  if (!employee) return undefined;
  
  return {
    employeeid: employee.employee_id,
    email: employee.email,
    pwd: employee.password,
    name: employee.name,
    role: employee.role?.name,
    roleid: employee.role_id,
    isactive: employee.is_active,
    hasfirstlogin: employee.has_first_login,
    totpsecret: employee.totp_secret,
    curp: employee.curp,
    birthdate: employee.birth_date,
    picture: employee.picture,
    startdate: employee.start_date,
    nss: employee.nss,
    bank_account: employee.bank_account,
    failedloginattempts: employee.failed_login_attempts,
    failed2faattempts: employee.failed_2fa_attempts,
    blockeduntil: employee.blocked_until,
    twofablockeduntil: employee.two_fa_blocked_until,
    temptotpsecret: employee.temp_totp_secret,
    temptotpsecretcreatedat: employee.temp_totp_secret_created_at,
  };
}

/**
 * @param {string} email
 * @returns {Promise<{ employeeid: string, email: string, pwd: string, name: string, role: string } | undefined>}
 */
async function findEmployeeByEmail(email) {
  const employee = await prisma.employee.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive",
      },
    },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
}

async function getEmployeeById(employeeid) {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeid },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
}

async function updatePassword(employeeid, newPassword) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      password: newPassword,
    },
  });
}

async function setFirstLogin(employeeid, hasFirstLogin) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      has_first_login: hasFirstLogin,
    },
  });
}

async function incrementFailedAttempts(employeeid) {
  const employee = await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      failed_login_attempts: {
        increment: 1,
      },
    },
    select: {
      failed_login_attempts: true,
    },
  });
  return employee.failed_login_attempts ?? 0;
}

async function resetFailedAttempts(employeeid) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      failed_login_attempts: 0,
    },
  });
}

async function setBlockedUntil(employeeid, blockedUntil) {
  return prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      blocked_until: blockedUntil,
    },
    select: {
      employee_id: true,
      blocked_until: true,
    },
  });
}

async function clearBlockedUntil(employeeid) {
  return prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      blocked_until: null,
    },
    select: {
      employee_id: true,
      blocked_until: true,
    },
  });
}

async function clearLoginSecurityState(employeeid) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      failed_login_attempts: 0,
      blocked_until: null,
    },
  });
}

async function createLog(employeeid, actionId, ipAddress, affected = null) {
  await prisma.logs.create({
    data: {
      log_id: randomUUID(),
      employee_id: employeeid,
      moment: new Date(),
      action_id: actionId,
      affected,
      ip_address: hashIp(ipAddress),
    },
  });
}

async function saveTempTotpSecret(employeeid, secret) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      temp_totp_secret: secret,
      temp_totp_secret_created_at: new Date(),
    },
  });
}

async function clearTempTotpSecret(employeeid) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      temp_totp_secret: null,
      temp_totp_secret_created_at: null,
    },
  });
}

async function activateTempTotpSecret(employeeid) {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeid },
    select: {
      temp_totp_secret: true,
    },
  });

  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      totp_secret: employee?.temp_totp_secret ?? null,
      temp_totp_secret: null,
      temp_totp_secret_created_at: null,
    },
  });
}

async function completeFirstLoginPasswordChange(employeeid, hashedPassword, ipAddress) {
  const hashedIp = hashIp(ipAddress);

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { employee_id: employeeid },
      data: {
        password: hashedPassword,
        has_first_login: false,
      },
    });

    await tx.logs.create({
      data: {
        log_id: randomUUID(),
        employee_id: employeeid,
        moment: new Date(),
        action_id: LOG_ACTIONS.FIRST_LOGIN_PASSWORD_CHANGED,
        affected: null,
        ip_address: hashedIp,
      },
    });

    await tx.logs.create({
      data: {
        log_id: randomUUID(),
        employee_id: employeeid,
        moment: new Date(),
        action_id: LOG_ACTIONS.FIRST_LOGIN_COMPLETED,
        affected: null,
        ip_address: hashedIp,
      },
    });
  });
}

async function activateTempTotpSecretWithLog(employeeid, ipAddress) {
  const hashedIp = hashIp(ipAddress);

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { employee_id: employeeid },
      select: {
        temp_totp_secret: true,
      },
    });

    await tx.employee.update({
      where: { employee_id: employeeid },
      data: {
        totp_secret: employee?.temp_totp_secret ?? null,
        temp_totp_secret: null,
        temp_totp_secret_created_at: null,
      },
    });

    await tx.logs.create({
      data: {
        log_id: randomUUID(),
        employee_id: employeeid,
        moment: new Date(),
        action_id: LOG_ACTIONS.TWO_FA_SETUP_SUCCESS,
        affected: null,
        ip_address: hashedIp,
      },
    });
  });
}

async function disableTotpSecretWithLog(employeeid, ipAddress) {
  const hashedIp = hashIp(ipAddress);

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { employee_id: employeeid },
      data: {
        totp_secret: null,
        temp_totp_secret: null,
        temp_totp_secret_created_at: null,
      },
    });

    await tx.logs.create({
      data: {
        log_id: randomUUID(),
        employee_id: employeeid,
        moment: new Date(),
        action_id: LOG_ACTIONS.TWO_FA_DISABLED,
        affected: null,
        ip_address: hashedIp,
      },
    });
  });
}

async function incrementFailed2FAAttempts(employeeid) {
  const employee = await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      failed_2fa_attempts: {
        increment: 1,
      },
    },
    select: {
      failed_2fa_attempts: true,
    },
  });

  return employee.failed_2fa_attempts ?? 0;
}

async function set2FABlockedUntil(employeeid, blockedUntil) {
  return prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      two_fa_blocked_until: blockedUntil,
    },
    select: {
      employee_id: true,
      two_fa_blocked_until: true,
    },
  });
}

async function clear2FASecurityState(employeeid) {
  await prisma.employee.update({
    where: { employee_id: employeeid },
    data: {
      failed_2fa_attempts: 0,
      two_fa_blocked_until: null,
    },
  });
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
  completeFirstLoginPasswordChange,
  activateTempTotpSecretWithLog,
  disableTotpSecretWithLog,
  incrementFailed2FAAttempts,
  set2FABlockedUntil,
  clear2FASecurityState,
};
