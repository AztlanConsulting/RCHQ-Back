const prisma = require("../prisma");

function mapEmployee(employee) {
  if (!employee) return undefined;

  return {
    employeeId: employee.employee_id,
    email: employee.email,
    pwd: employee.password,
    name: employee.name,
    role: employee.role?.name,
    roleId: employee.role_id,
    isActive: employee.is_active,
    hasFirstLogin: employee.has_first_login,
    isActive2FA: employee.is_active_2fa,
    totpSecret: employee.totp_secret,
    curp: employee.curp,
    birthDate: employee.birth_date,
    picture: employee.picture,
    startDate: employee.start_date,
    nss: employee.nss,
    bankAccount: employee.bank_account,
    failedLoginAttempts: employee.failed_login_attempts,
    failed2faAttempts: employee.failed_2fa_attempts,
    blockedUntil: employee.blocked_until,
    twoFaBlockedUntil: employee.two_fa_blocked_until,
    tempTotpSecret: employee.temp_totp_secret,
    tempTotpSecretCreatedAt: employee.temp_totp_secret_created_at,
  };
}

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

async function getEmployeeById(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
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

// async function updatePassword(employeeId, newPassword) {
//   await prisma.employee.update({
//     where: { employee_id: employeeId },
//     data: {
//       password: newPassword,
//     },
//   });
// }

// async function setFirstLogin(employeeId, hasFirstLogin) {
//   await prisma.employee.update({
//     where: { employee_id: employeeId },
//     data: {
//       has_first_login: hasFirstLogin,
//     },
//   });
// }

async function incrementFailedAttempts(employeeId) {
  const employee = await prisma.employee.update({
    where: { employee_id: employeeId },
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

async function resetFailedAttempts(employeeId) {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      failed_login_attempts: 0,
    },
  });
}

async function setBlockedUntil(employeeId, blockedUntil) {
  return prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      blocked_until: blockedUntil,
    },
    select: {
      employee_id: true,
      blocked_until: true,
    },
  });
}

async function clearBlockedUntil(employeeId) {
  return prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      blocked_until: null,
    },
    select: {
      employee_id: true,
      blocked_until: true,
    },
  });
}

async function clearLoginSecurityState(employeeId) {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      failed_login_attempts: 0,
      blocked_until: null,
    },
  });
}

async function saveTempTotpSecret(employeeId, secret) {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      temp_totp_secret: secret,
      temp_totp_secret_created_at: new Date(),
    },
  });
}

async function clearTempTotpSecret(employeeId) {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      temp_totp_secret: null,
      temp_totp_secret_created_at: null,
    },
  });
}

async function incrementFailed2FAAttempts(employeeId) {
  const employee = await prisma.employee.update({
    where: { employee_id: employeeId },
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

async function set2FABlockedUntil(employeeId, blockedUntil) {
  return prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      two_fa_blocked_until: blockedUntil,
    },
    select: {
      employee_id: true,
      two_fa_blocked_until: true,
    },
  });
}

async function clear2FASecurityState(employeeId) {
  await prisma.employee.update({
    where: { employee_id: employeeId },
    data: {
      failed_2fa_attempts: 0,
      two_fa_blocked_until: null,
    },
  });
}

module.exports = {
  findEmployeeByEmail,
  // updatePassword,
  // setFirstLogin,
  incrementFailedAttempts,
  resetFailedAttempts,
  setBlockedUntil,
  clearLoginSecurityState,
  getEmployeeById,
  saveTempTotpSecret,
  clearTempTotpSecret,
  clearBlockedUntil,
  incrementFailed2FAAttempts,
  set2FABlockedUntil,
  clear2FASecurityState,
};
