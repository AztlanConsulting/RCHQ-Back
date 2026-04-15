const { generateToken, generateFirstLoginToken, generatePre2faToken } = require("../jwt");

function buildUserPayload(employee) {
    return {
        id: employee.employeeid,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        privileges: ["read_profile"],
    };
}

function buildSessionToken(employee) {
    return generateToken(buildUserPayload(employee));
}

function buildFirstLoginJwt(employee) {
    return generateFirstLoginToken({
        id: employee.employeeid,
        email: employee.email,
    });
}

function buildPre2faJwt(employee) {
    return generatePre2faToken({
        id: employee.employeeid,
        email: employee.email,
    });
}

module.exports = {
    buildUserPayload,
    buildSessionToken,
    buildFirstLoginJwt,
    buildPre2faJwt,
};