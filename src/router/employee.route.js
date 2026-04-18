const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/upload");

const employeeController = require("../controller/employee/employeeAdd.controller");

router.get("/add", verifyToken, employeeController.getAdd);

router.get("/:id", employeeController.getById);

router.post("/add", verifyToken, upload.single("picture"), employeeController.postAdd);

module.exports = router;
