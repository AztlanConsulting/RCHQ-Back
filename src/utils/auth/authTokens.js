const { generateToken,
    // generateFirstLoginToken, 
    generatePre2faToken,
} = require("../jwt");

function buildUserPayload(employee) {
    return {
        id: employee.employeeId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
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

function buildPre2faJwt(employee) {
     return generatePre2faToken({
         id: employee.employeeId,
         email: employee.email,
     });
 }

module.exports = {
    buildUserPayload,
    buildSessionToken,
    // buildFirstLoginJwt,
    buildPre2faJwt,
};