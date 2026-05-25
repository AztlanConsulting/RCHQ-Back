const prisma = require("../../prisma");

exports.deleteFromBlacklist = async (curp, reason) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const deleted = await tx.blacklist.delete({
                where: { curp: curp },
            });

            await tx.employee.update({
                where: { curp: curp },
                data: { out_of_blacklist_reason: reason },
            });

            return deleted;
        });
        return result;
    } catch (error) {
        console.error("Error en deleteFromBlacklist:", error);
        return null;
    }
};