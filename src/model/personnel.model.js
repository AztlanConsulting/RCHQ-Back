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

// return information about the employee's schedule,
// vacations, faults, and other cyclic employee data
// aggregate data from:
// employee_faults -> faults
// employee_address
// employee_workday
// employee_vacation_requests
async function getAdminEmployeeInfoById() {
    // const result = await prisma.employee
    const result = "";

    return result;
}

async function getEmployeeRecord() {

}

module.exports = {
  findEmployeeByEmail,
  getEmployeeById,
  getAdminEmployeeInfoById,
  getEmployeeRecord
};
