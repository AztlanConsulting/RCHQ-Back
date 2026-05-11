const prisma = require("../../prisma");
const { mapHouse } = require("../../utils/mappers/house.map");

exports.getHouseById = async (houseId) => {
    const house = await prisma.house.findUnique({
        where: { house_id: houseId },
    });
    return mapHouse(house);
};

exports.getAllHouses = async () => {
    const houses = await prisma.house.findMany();
    return houses.map(mapHouse);
};