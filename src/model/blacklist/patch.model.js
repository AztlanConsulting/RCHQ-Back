const prisma = require("../../prisma");

exports.transactionalBlacklistInsert = async (curp) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.employee.update({
                where: { curp: curp },
                data: { is_active: false },
            });

            const entry = await tx.blacklist.create({
                data: {
                    curp: curp,
                    created_at: new Date(),
                },
            });

            return entry;
        });

        return {
            blacklistId: result.blacklist_id,
            curp: result.curp,
            createdAt: result.created_at,
        };
    } catch {
        return null; 
    }
};