const prisma = require("../../prisma");
const { mapHouse } = require("../../utils/mappers/house.map");

exports.getHouseById = async (houseId) => {
    const house = await prisma.house.findUnique({
        where: { house_id: houseId },
    });
    return mapHouse(house);
};

exports.getHouseNameByEmployeeId = async (employeeId) => {
    const row = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: {
            house: { select: { name: true } },
        },
    });
    if (!row) return null;
    return row.house?.name ?? null;
};
