const express = require("express");
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { ROLES, allRoles } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { authorize } = require("../middleware/abac");
const {
    resolveEmployeeHouse,
    resolveRequesterHouse,
} = require("../middleware/resolvers");
const { absencePolicy } = require("../policies/absence.policies");
const {
    getAbsenceTypes,
    getEmployeesAndAbsenceTypes,
} = require("../controller/absence/get.controller");
const { addAbsence } = require("../controller/absence/create.controller");
const { updateAbsence } = require("../controller/absence/update.controller");
const { deleteAbsence } = require("../controller/absence/delete.controller");
const { absenceUpdateSchema } = require("../schemas/absence/update.schemas");
const { absenceDeleteSchema } = require("../schemas/absence/delete.schemas");
const { uploadDocs } = require("../middleware/uploadDocs");

const router = express.Router();

const markEvidenceUpload = (req, res, next) => {
    if (req.file) {
        req.body.hasEvidenceFile = true;
    }

    next();
};

router.get(
    "/add",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.ADD_ABSENCES),
    getEmployeesAndAbsenceTypes,
);

router.get(
    "/types",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(...allRoles),
    getAbsenceTypes,
);

router.post(
    "/:employeeId/add",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.ADD_ABSENCES),
    resolveEmployeeHouse,
    authorize(absencePolicy, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    uploadDocs.single("file"),
    markEvidenceUpload,
    addAbsence,
);

router.put(
    "/:absenceId",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.EDIT_ABSENCES),
    uploadDocs.single("file"),
    markEvidenceUpload,
    validate(absenceUpdateSchema, "all"),
    updateAbsence,
);

router.delete(
    "/:absenceId",
    apiLimiter,
    verifyToken,
    resolveRequesterHouse,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.DELETE_ABSENCES),
    validate(absenceDeleteSchema, "all"),
    deleteAbsence,
);

module.exports = router;
