const prisma = require("../../prisma");

exports.transactionalBlacklistInsert = async (employeeId, curp) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.employee.update({
                where: { employee_id: employeeId },
                data: { is_active: false },
            });

            const entry = await tx.blacklist.create({
                data: {
                    employee_id: employeeId,
                    curp: curp,
                    created_at: new Date(),
                },
            });

            return entry;
        });

        return {
            blacklistId: result.blacklist_id,
            employeeId: result.employee_id,
            curp: result.curp,
            createdAt: result.created_at,
        };
    } catch (error) {
        console.error("Error en transactionalBlacklistInsert:", error);
        return null; 
    }
};