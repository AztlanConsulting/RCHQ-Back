exports.mapEmployee = (employee) => {
  if (!employee) return undefined;

  return {
    employeeId: employee.employee_id,
    email: employee.email,
    pwd: employee.password,
    name: employee.name,
    surname: employee.surname,
    role: employee.role?.name,
    roleId: employee.role_id,
    type: employee.type,
    isActive: employee.is_active,
    hasFirstLogin: employee.has_first_login,
    isActive2FA: employee.is_active_2fa,
    totpSecret: employee.totp_secret,
    curp: employee.curp,
    birthDate: employee.birth_date,
    picture: employee.picture,
    startDate: employee.start_date,
    endDate: employee.end_date,
    phoneNumber: employee.phone_number,
    nss: employee.nss,
    bankAccount: employee.bank_account,
    salary: employee.salary,
    failedLoginAttempts: employee.failed_login_attempts,
    failed2faAttempts: employee.failed_2fa_attempts,
    blockedUntil: employee.blocked_until,
    twoFaBlockedUntil: employee.two_fa_blocked_until,
    tempTotpSecret: employee.temp_totp_secret,
    tempTotpSecretCreatedAt: employee.temp_totp_secret_created_at,
  };
};

exports.mapEmployeeAddress = (employeeAddress) => {
  if (!employeeAddress) return undefined;

  return {
    employeeAddressId: employeeAddress.employee_address_id,
    url: employeeAddress.url,
    date: employeeAddress.date,
    street: employeeAddress.street,
    municipio: employeeAddress.municipio,
    city: employeeAddress.city,
    postal_code: employeeAddress.postal_code,
  };
};

exports.mapHouse = (house) => {
  if (!house) return undefined;

  return {
    houseId: house.house_id,
    name: house.name,
    location: house.location,
    phoneNumber: house.phone_number,
    description: house.description,
    image: house.image,
  };
};
