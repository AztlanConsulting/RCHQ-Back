const {randomUUID} = require("crypto");
const prisma = require("../prisma");

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
          Name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
}

async function getEmployeeById(employeeid) {
  const employee = await prisma.employee.findUnique({
    where: { employeeid },
    include: {
      role: {
        select: {
          Name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
}

async function updatePassword(employeeid, newPassword) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      Password: newPassword,
    },
  });
}

async function setFirstLogin(employeeid, hasFirstLogin) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      hasfirstlogin: hasFirstLogin,
    },
  });
}

async function incrementFailedAttempts(employeeid) {
  const employee = await prisma.employee.update({
    where: { employeeid },
    data: {
      failedloginattempts: {
        increment: 1,
      },
    },
    select: {
      failedloginattempts: true,
    },
  });
  return employee.failedloginattempts ?? 0;
}

async function resetFailedAttempts(employeeid) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      failedloginattempts: 0,
    },
  });
}

async function setBlockedUntil(employeeid, blockedUntil) {
  return prisma.employee.update({
    where: { employeeid },
    data: {
      blockeduntil: blockedUntil,
    },
    select: {
      employeeid: true,
      blockeduntil: true,
    },
  });
}

async function clearBlockedUntil(employeeid) {
  return prisma.employee.update({
    where: { employeeid },
    data: {
      blockeduntil: null,
    },
    select: {
      employeeid: true,
      blockeduntil: true,
    },
  });
}

async function clearLoginSecurityState(employeeid) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      failedloginattempts: 0,
      blockeduntil: null,
    },
  });
}

// temporal porque solo funciona cuando employee existe
async function createLog(employeeid, description, ipAddress) {
  await prisma.logs.create({
    data: {
      logid: randomUUID(),
      employeeid,
      moment: new Date(),
      description,
      ip_address: ipAddress,
    },
  });
}

async function createLogThrottled(employeeid, description, ipAddress, windowMinutes = 5) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const existing = await prisma.logs.findFirst({
    where: {
      employeeid,
      description,
      ip_address: ipAddress,
      moment: {
        gte: since,
      },
    },
    select: {
      logid: true,
    },
  });

  if (existing) {
    return { inserted: false };
  }

  await prisma.logs.create({
    data: {
      logid: randomUUID(),
      employeeid,
      moment: new Date(),
      description,
      ip_address: ipAddress,
    },
  });

  return { inserted: true };
}

async function saveTempTotpSecret(employeeid, secret) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      temptotpsecret: secret,
      temptotpsecretcreatedat: new Date(),
    },
  });
}

async function clearTempTotpSecret(employeeid) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      temptotpsecret: null,
      temptotpsecretcreatedat: null,
    },
  });
}

async function activateTempTotpSecret(employeeid) {
  const employee = await prisma.employee.findUnique({
    where: { employeeid },
    select: {
      temptotpsecret: true,
    },
  });

  await prisma.employee.update({
    where: { employeeid },
    data: {
      totpsecret: employee?.temptotpsecret ?? null,
      temptotpsecret: null,
      temptotpsecretcreatedat: null,
    },
  });
}

async function completeFirstLoginPasswordChange(employeeid, hashedPassword, ipAddress) {
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { employeeid },
      data: {
        Password: hashedPassword,
        hasfirstlogin: false,
      },
    });

    await tx.logs.create({
      data: {
        logid: randomUUID(),
        employeeid,
        moment: new Date(),
        description: "Cambio de contraseña en primer acceso",
        ip_address: ipAddress,
      },
    });

    await tx.logs.create({
      data: {
        logid: randomUUID(),
        employeeid,
        moment: new Date(),
        description: "Inicio de sesión completado después de cambio de contraseña en primer acceso",
        ip_address: ipAddress,
      },
    });
  });
}

async function activateTempTotpSecretWithLog(employeeid, ipAddress) {
  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { employeeid },
      select: {
        temptotpsecret: true,
      },
    });

    await tx.employee.update({
      where: { employeeid },
      data: {
        totpsecret: employee?.temptotpsecret ?? null,
        temptotpsecret: null,
        temptotpsecretcreatedat: null,
      },
    });

    await tx.logs.create({
      data: {
        logid: randomUUID(),
        employeeid,
        moment: new Date(),
        description: "Activación exitosa de 2FA",
        ip_address: ipAddress,
      },
    });
  });
}

async function disableTotpSecretWithLog(employeeid,ipAddress) {
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { employeeid },
      data: {
        totpsecret: null,
        temptotpsecret: null,
        temptotpsecretcreatedat: null,
      },
    });

    await tx.logs.create({
      data: {
        logid: randomUUID(),
        employeeid,
        moment: new Date(),
        description: "Desactivación exitosa de 2FA",
        ip_address: ipAddress,
      },
    });
  });
}

async function incrementFailed2FAAttempts(employeeid) {
  const employee = await prisma.employee.update({
    where: { employeeid },
    data: {
      failed2faattempts: {
        increment: 1,
      },
    },
    select: {
      failed2faattempts: true,
    },
  });

  return employee.failed2faattempts ?? 0;
}

async function set2FABlockedUntil(employeeid, blockedUntil) {
  return prisma.employee.update({
    where: { employeeid },
    data: {
      twofablockeduntil: blockedUntil,
    },
    select: {
      employeeid: true,
      twofablockeduntil: true,
    },
  });
}

async function clear2FASecurityState(employeeid) {
  await prisma.employee.update({
    where: { employeeid },
    data: {
      failed2faattempts: 0,
      twofablockeduntil: null,
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
  createLogThrottled,
  completeFirstLoginPasswordChange,
  activateTempTotpSecretWithLog,
  disableTotpSecretWithLog,
  incrementFailed2FAAttempts,
  set2FABlockedUntil,
  clear2FASecurityState
};
