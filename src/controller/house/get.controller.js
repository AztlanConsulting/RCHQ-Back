const {getAllHouses} = require("../../service/house/get.service");
const RESPONSES = require("../../utils/responses");

exports.getAllHouses = async (req, res) => {
  try {
    const result = await getAllHouses();

    if (result.type === "HOUSES_FOUND") {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(404).json({ success: false, message: RESPONSES.HOUSE.NOT_FOUND });
    }
  } catch (error) {
    console.error("Error obteniendo las casas: ", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};