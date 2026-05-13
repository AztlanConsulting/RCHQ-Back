const prisma = require("../../prisma");

exports.insertBlacklist = async (employeeId, curp) => {
    try {
        const entry = await prisma.blacklist.create({
            data: {
                employee_id: employeeId,
                curp,
                created_at: new Date(),
            },
        });

        return {
            blacklistId: entry.blacklist_id,
            employeeId: entry.employee_id,
            curp: entry.curp,
            createdAt: entry.created_at,
        };
    } catch {
        return null;
    }
};