const prisma = require("../../prisma");

exports.deleteFromBlacklist = async (curp) => {
    try {
        const result = await prisma.blacklist.delete({
            where: { curp: curp },
        });
        return result;
    } catch (error) {
        console.error("Error en deleteFromBlacklist:", error);
        return null;
    }
};