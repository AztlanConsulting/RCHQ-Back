const express = require("express");
const verifyToken = require("../middleware/auth");
const validate = require("../middleware/validate");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { getAbsenceTypes } = require("../controller/absence/get.controller");
const { updateAbsence } = require("../controller/absence/update.controller");
const { absenceUpdateSchema } = require("../schemas/absence/update.schemas");
const { uploadDocs } = require("../middleware/uploadDocs");

const router = express.Router();

const markEvidenceUpload = (req, res, next) => {
    if (req.file) {
        req.body.hasEvidenceFile = true;
    }

    next();
};

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
    uploadDocs.single("file"),
    markEvidenceUpload,
    validate(absenceUpdateSchema, "all"),
    updateAbsence,
);

module.exports = router;
