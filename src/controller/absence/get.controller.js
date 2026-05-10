const RESPONSES = require("../../utils/responses");
const { getAllAbsences } = require("../../service/absence/get.service");

exports.getAllAbsences = async (req, res) => {
  const { page, limit, name, house, evidence, startFrom, endTo, deleted } = req.query;

  const filters = {
    ...(name      && { name }),
    ...(house     && { house }),
    ...(evidence  && { evidence }),
    ...(startFrom && { startFrom }),
    ...(endTo     && { endTo }),
    deleted: deleted ?? "false",   // ← siempre presente, default activas
  };

  try {
    const result = await getAllAbsences(parseInt(page), parseInt(limit), filters);

    if (result.type === RESPONSES.ABSENCE.BAD_REQUEST) {
      return res.status(400).json({ success: false, message: result.type });
    }
    if (result.type === RESPONSES.ABSENCE.FOUND) {
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    }
  } catch (error) {
    console.error("Error obteniendo las ausencias: ", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};