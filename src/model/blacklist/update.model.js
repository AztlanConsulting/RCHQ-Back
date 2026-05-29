const prisma = require("../../prisma");

exports.transactionalBlacklistInsert = async (curp, reason) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.employee.update({
                where: { curp: curp },
                data: { is_active: false },
            });

            const entry = await tx.blacklist.create({
                data: {
                    curp: curp,
                    reason: reason,
                },
            });

            return entry;
        });

        return {
            blacklistId: result.blacklist_id,
            curp: result.curp,
            reason: result.reason,
            createdAt: result.created_at,
        };
    } catch (error) {
        console.error("Error en transactionalBlacklistInsert:", error);
        return null; 
    }
};