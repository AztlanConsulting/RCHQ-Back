const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../utils/rateLimit");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { canAddToBlacklist } = require("../middleware/abac");
const { insertIntoBlacklist } = require("../controller/blacklist/create.controller");
const validate = require("../middleware/validate");
const { blacklistCreateSchema } = require("../schemas/blacklist/create.schemas");

router.post(
    "/",
    apiLimiter,
    verifyToken,
    requireRole("Coordinador"),
    validate(blacklistCreateSchema),
    canAddToBlacklist,
    insertIntoBlacklist
);

module.exports = router;