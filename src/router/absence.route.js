const express = require("express");
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { authorize } = require("../middleware/abac");
const { modifyEmployee } = require("../policies/employee.policies");
const {
    resolveRequesterHouse,
    resolveAbsenceHouse,
} = require("../middleware/resolvers");
const { getAbsenceTypes } = require("../controller/absence/get.controller");
const { updateAbsence } = require("../controller/absence/update.controller");
const { deleteAbsence } = require("../controller/absence/delete.controller");
const { absenceUpdateSchema } = require("../schemas/absence/update.schemas");
const { absenceDeleteSchema } = require("../schemas/absence/delete.schemas");

const router = express.Router();

router.get(
    "/types",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Coordinador"),
    getAbsenceTypes,
);

router.put(
    "/:absenceId",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("editAbsences"),
    validate(absenceUpdateSchema, "all"),
    updateAbsence,
);

router.delete(
    "/:absenceId",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("deleteAbsences"),
    validate(absenceDeleteSchema, "all"),
    resolveAbsenceHouse,
    authorize(modifyEmployee, (req) => ({
        houseId: req.resolvedAbsence.houseId,
    })),
    deleteAbsence,
);

module.exports = router;
