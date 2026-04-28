const personnelService = require("../service/personnel.service");
const responses = require("../utils/responses");

exports.getEmployeeDetail = async (req, res) => {
  try {
    // const result = await personnelService.getEmployeeDetail(req);
    const userID = req.user.id;
    const { employeeID } = req.params;

    // Return 400 Bad request if there is no employee id to lookup
    if (!userID || !employeeID) {
      return res.status(400).json({
        success: false,
        code: "Request Mala",
        message: "Body incompleto para este request",
      });
    }

    const result = await personnelService.getEmployeeDetail(userID, employeeID);
    console.log("result: ", result);

    if (result.code === responses.personnel.notFound) {
      return res.status(404).json({
        success: false,
        message: "Empleado con ID dado no encontrado",
      });
    }
    if (result.code === responses.personnel.found) {
      return res.status(200).json({
        success: false,
        message: "Data del empleado encontrado con éxito",
        data: result.data,
      });
    }

    return res.status(500).json({
      sucess: false,
      message: "No deberia pasar esto en teoria",
      data: {},
    });
  } catch (err) {
    console.error("Employee detail error:", err);
    return res.status(500).json({
      success: false,
      message: "Error Interno del Servidor",
    });
  }
};
