const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const { createEmployeePolicy } = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");

const employeeController = require("../controller/employee/employeeAdd.controller");

router.get("/add", verifyToken, employeeController.getAdd);

router.get("/:id", employeeController.getById);

router.post(
    "/add",
    verifyToken,
    upload.single("picture"),
    authorize(createEmployeePolicy, (req) => ({
        house_id: req.body.house_id,
    })),
    employeeController.postAdd,
);

module.exports = router;
