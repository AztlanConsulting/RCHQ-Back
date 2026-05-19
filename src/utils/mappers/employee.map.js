exports.mapEmployee = (employee) => {
    if (!employee) return undefined;

    return {
        employeeId: employee.employee_id,
        email: employee.email,
        name: employee.name,
        surname: employee.surname,
        role: employee.role?.name,
        roleId: employee.role_id,
        houseId: employee.house_id,
        type: employee.type,
        isActive: employee.is_active,
        curp: employee.curp,
        birthDate: employee.birth_date,
        picture: employee.picture,
        startDate: employee.start_date,
        endDate: employee.end_date,
        phoneNumber: employee.phone_number,
        nss: employee.nss,
        rfc: employee.rfc,
        bankAccount: employee.bank_account,
        salary: employee.salary,
        frequencyOfPaymentId:   employee.frequency_of_payment_id,
        frequencyOfPaymentName: employee.frecuency_of_payment?.name ?? null,
        isBlacklisted: !!employee.blacklist,
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
        postalCode: employeeAddress.postal_code,
    };
};

exports.mapEmployeeFaults = (employeeFaults) => {
    if (!employeeFaults) return undefined;

    return employeeFaults.employee_fault.map((ef) => ({
        faultId: ef.fault.fault_id,
        date: ef.fault.date,
        description: ef.fault.description,
    }));
};

exports.mapEmployeeWorkdays = (employeeWorkdays) => {
    if (!employeeWorkdays) return undefined;

    return employeeWorkdays.employee_workday.map((w) => ({
        workdayId: w.workday.workday_id,
        name: w.workday.name,
        start: w.start,
        end: w.end,
    }));
};

exports.mapEmployeeVacationRequests = (employeeVacationRequests) => {
    if (!employeeVacationRequests) return undefined;

    return employeeVacationRequests.vacations_request.map((v) => ({
        vacationsRequestId: v.vacations_request_id,
        start: v.start,
        end: v.end,
        status: v.status,
        feedback: v.feedback,
    }));
};

exports.mapEmployeeBasicData = (body) => {
  const mapped = {};
  if (body.name        !== undefined) mapped.name         = body.name;
  if (body.surname     !== undefined) mapped.surname       = body.surname;
  if (body.curp        !== undefined) mapped.curp          = body.curp;
  if (body.rfc         !== undefined) mapped.rfc           = body.rfc;
  if (body.nss         !== undefined) mapped.nss           = body.nss;
  if (body.bankAccount !== undefined) mapped.bank_account  = body.bankAccount;
  if (body.birthDate   !== undefined) {
    mapped.birth_date = body.birthDate ? new Date(body.birthDate) : null;
  }
  return mapped;
};

exports.mapEmployeeContactData = (body) => {
  const mapped = {};
  if (body.email       !== undefined) mapped.email        = body.email;
  if (body.phoneNumber !== undefined) mapped.phone_number = body.phoneNumber;
  return mapped;
};

exports.mapAddressData = (body) => {
  const mapped = {};
  if (body.street     !== undefined) mapped.street      = body.street;
  if (body.municipio  !== undefined) mapped.municipio   = body.municipio;
  if (body.city       !== undefined) mapped.city        = body.city;
  if (body.postalCode !== undefined) mapped.postal_code = body.postalCode;
  return mapped;
};

exports.mapEmployeeAdminData = (body) => {
  const mapped = {};
  if (body.houseId !== undefined) mapped.house_id = body.houseId;
  if (body.roleId  !== undefined) mapped.role_id  = body.roleId;
  if (body.type    !== undefined) mapped.type     = body.type;
  if (body.salary  !== undefined) mapped.salary   = body.salary;
  if (body.frequencyOfPaymentId !== undefined) mapped.frequency_of_payment_id = body.frequencyOfPaymentId;
  return mapped;
};
