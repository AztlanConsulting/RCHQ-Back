const {
    generateToken,
    generateFirstLoginToken,
    generatePreTwoFactorAuthToken,
} = require("../jwt");
const prisma = require("../../prisma");

async function buildUserPayload(employee) {
    const roleWithPrivileges = await prisma.role.findUnique({
        where: { role_id: employee.roleId },
        include: {
            role_privilege: {
                include: { privilege: true },
            },
        },
    });

    const privileges =
        roleWithPrivileges?.role_privilege.map((rp) => rp.privilege.name) ?? [];

    return {
        id: employee.employeeId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        houseId: employee.houseId,
        privileges,
        tokenType: "SESSION",
    };
}

exports.buildSessionToken = async (employee) => {
    const payload = await buildUserPayload(employee);
    const token = generateToken(payload);
    return token;
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
