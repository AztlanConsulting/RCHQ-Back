const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { beneficiaryCreateSchema } = require("../schemas/beneficiary/blacklist.schema");
const {
    registerBeneficiary
} = require("../controller/beneficiary/update.controller");

const router = express.Router();

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.CREATE_BENEFICIARY),
    resolveRequesterHouse,
    validate(beneficiaryCreateSchema, "body"),
    // validate(rejectVacationRequestSchema, "all"),
    // authorize not necessary because there is no house to compare
    registerBeneficiary,
);



module.exports = router;
