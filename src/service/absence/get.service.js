const RESPONSES = require("../../utils/responses");
const { getAllAbsences } = require("../../model/absence/get.model");
const { mapAbsence }    = require("../../utils/mappers/absence.map");

const buildWhere = (filters = {}) => {
  const isDeleted = filters.deleted === "true";
  const where = { is_deleted: isDeleted };

  const employeeFilter = {};
  if (filters.name)    employeeFilter.name    = { contains: filters.name, mode: "insensitive" };
  if (filters.houseId) employeeFilter.house   = { house_id: filters.houseId };
  if (Object.keys(employeeFilter).length > 0) where.employee = employeeFilter;

  if (filters.evidence === "con") where.url = { not: null };
  if (filters.evidence === "sin") where.url = null;

  if (filters.startFrom) where.start = { gte: new Date(filters.startFrom) };
  if (filters.endTo)     where.end   = { lte: new Date(filters.endTo) };

  return where;
};

exports.getAllAbsences = async (page, limit, filters = {}) => {
  if (!page || !limit) return { success: false, type: RESPONSES.ABSENCE.BAD_REQUEST };
  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1)
    return { success: false, type: RESPONSES.ABSENCE.BAD_REQUEST };

  const parsedLimit = Math.min(parseInt(limit), 100);
  const where = buildWhere(filters);

  try {
    const result = await getAllAbsences(page, parsedLimit, where);
    if (!result || result.success === false) throw new Error("Error en modelo de ausencias");
    return {
      success: true,
      type: RESPONSES.ABSENCE.FOUND,
      data: (result.data ?? []).map(mapAbsence),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error obteniendo las ausencias: ", error);
    return { success: false, type: "Error interno del servidor" };
  }
};