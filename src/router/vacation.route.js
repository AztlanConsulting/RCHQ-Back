const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { apiLimiter } = require("../utils/rateLimit");
const {
    isAllowed
} = require("../middleware/abac");

const { getRemainingVacations } = require("../controller/vacation/get.controller");

const { requestVacation } = require("../controller/vacation/create.controller");

router.get("/remaining/:id", apiLimiter, verifyToken, isAllowed, getRemainingVacations);

router.post("/request", apiLimiter, verifyToken, requestVacation);


module.exports = router;