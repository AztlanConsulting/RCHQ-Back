exports.mapEmployee = (employee) => {
  if (!employee) return undefined;

  return {
    employeeId: employee.employee_id,
    email: employee.email,
    name: employee.name,
    surname: employee.surname,
    role: employee.role?.name,
    roleId: employee.role_id,
    type: employee.type,
    isActive: employee.is_active,
    curp: employee.curp,
    birthDate: employee.birth_date,
    picture: employee.picture,
    startDate: employee.start_date,
    endDate: employee.end_date,
    phoneNumber: employee.phone_number,
    nss: employee.nss,
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
