const {
  generateToken,
  // generateFirstLoginToken,
  generatePreTwoFactorAuthToken,
} = require("../jwt");

function buildUserPayload(employee) {
  return {
    id: employee.employeeId,
    email: employee.email,
    name: employee.name,
    role: employee.role,
    houseId: employee.houseId,
    privileges: ["read_profile"],
  };
}

function buildSessionToken(employee) {
  return generateToken(buildUserPayload(employee));
}

// function buildFirstLoginJwt(employee) {
//     return generateFirstLoginToken({
//         id: employee.employeeId,
//         email: employee.email,
//     });
// }

function buildPreTwoFactorAuthJwt(employee) {
  return generatePreTwoFactorAuthToken({
    id: employee.employeeId,
    email: employee.email,
  });
}

module.exports = {
  buildUserPayload,
  buildSessionToken,
  // buildFirstLoginJwt,
  buildPreTwoFactorAuthJwt,
};
