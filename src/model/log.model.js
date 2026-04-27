const { randomUUID } = require("crypto");
const prisma = require("../prisma");
const { hashIp } = require("../utils/hashIp");

exports.createLog = async (
    employeeId,
    actionId,
    ipAddress,
    affected = null,
    db = prisma,
) => {
    await db.logs.create({
        data: {
            log_id: randomUUID(),
            employee_id: employeeId,
            moment: new Date(),
            action_id: actionId,
            affected,
            ip_address: hashIp(ipAddress),
        },
    });
};
