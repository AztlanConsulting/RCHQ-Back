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

exports.getHouseEmployeesByEmployeeId = async (employeeId) => {
    const requester = await prisma.employee.findUnique({
        where: { employee_id: employeeId },
        select: { house_id: true },
    });

    if (!requester?.house_id) return null;

    return await prisma.employee.findMany({
        where: {
            house_id: requester.house_id,
        },
        select: {
            employee_id: true,
            name: true,
            surname: true,
            curp: true,
            is_active: true,
        },
        orderBy: [
            { name: "asc" },
            { surname: "asc" },
        ],
    });
};
