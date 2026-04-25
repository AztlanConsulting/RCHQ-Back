const {
  generateToken,
  generateFirstLoginToken,
  generatePre2faToken,
} = require("../jwt");

exports.buildUserPayload = (employee) => {
    return {
        id: employee.employeeId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        houseId: employee.houseId,
        privileges: ["read_profile"],
    };
}

exports.buildSessionToken = (employee) => {
    return generateToken(buildUserPayload(employee));
}

exports.buildFirstLoginJwt = (employee) => {
  return generateFirstLoginToken({
    id: employee.employeeId,
    email: employee.email,
  });
}

exports.buildPre2faJwt = (employee) => {
    return generatePre2faToken({
        id: employee.employeeId,
        email: employee.email,
    });
}

