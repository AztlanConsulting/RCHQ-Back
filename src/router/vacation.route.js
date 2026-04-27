const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
    isAllowed
} = require("../middleware/abac");

const {
    getRemainingVacations
} = require("../controller/vacation/add.controller")

router.get("/remaining/:id", verifyToken, isAllowed, getRemainingVacations);

module.exports = router;