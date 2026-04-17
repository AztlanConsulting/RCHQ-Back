const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const employeeController = require("../controller/employee/employeeAdd.controller");

router.get("/add", verifyToken, employeeController.getAdd);

router.get("/:id", employeeController.getById);

router.post("/add", verifyToken, employeeController.postAdd);

module.exports = router;
