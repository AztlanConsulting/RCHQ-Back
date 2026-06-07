const express = require("express");
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveRequesterHouse } = require("../middleware/resolvers");
const validate = require("../middleware/validate");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");
const { beneficiaryCreateSchema } = require("../schemas/beneficiary/create.schema");
const {
    registerBeneficiary,
} = require("../controller/beneficiary/create.controller");

const router = express.Router();

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.CREATE_BENEFICIARY),
    resolveRequesterHouse,
    validate(beneficiaryCreateSchema, "body"),
    registerBeneficiary,
);

module.exports = router;
