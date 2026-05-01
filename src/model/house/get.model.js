const prisma = require("../../prisma");
const { mapHouse } = require("../../utils/mappers/house.map");

exports.getHouseByEmployeeId = async (employeeId) => {
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
      select: { house_id: true },
    });
    if (!employee) return undefined;
  
    const house = await prisma.house.findUnique({
      where: { house_id: employee.house_id },
    });
    return mapHouse(house);
  };