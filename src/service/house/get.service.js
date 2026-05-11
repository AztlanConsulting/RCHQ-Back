const {getAllHouses} = require("../../model/house/get.model");

exports.getAllHouses = async () => {
    try {
        const houses = await getAllHouses();
        return { type: "HOUSES_FOUND", data: houses };
    } catch (error) {
        console.error("Error obteniendo las casas: ", error);
        throw error;
    };
}
  