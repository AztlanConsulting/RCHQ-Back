const {
    generateToken,
    generateFirstLoginToken,
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
        tokenType: "SESSION",
    };
}

exports.buildSessionToken = (employee) => {
    return generateToken(buildUserPayload(employee));
};

exports.buildFirstLoginJwt = (employee) => {
    return generateFirstLoginToken({
        id: employee.employeeId,
        email: employee.email,
        tokenType: "FIRST_LOGIN",
    });
};

exports.buildPreTwoFactorAuthJwt = (employee) => {
    return generatePreTwoFactorAuthToken({
        id: employee.employeeId,
        email: employee.email,
        tokenType: "preTwoFactorAuth",
    });
};
