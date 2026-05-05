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
