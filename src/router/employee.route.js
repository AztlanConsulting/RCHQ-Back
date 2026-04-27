const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { createEmployeePolicy } = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");
const {
    authorize,
    isAllowed
} = require("../middleware/abac");

const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/employeeAdd.controller");
const { getWorkDays } = require("../controller/employee/getOne.controller")

router.get("/add", verifyToken, getAdd);

router.get("/:id", getById);

router.get("/getWorkDays/:id", verifyToken, isAllowed, getWorkDays);

router.post(
    "/add",
    verifyToken,
    upload.single("picture"),
    authorize(createEmployeePolicy, (req) => ({
        house_id: req.body.house_id,
    })),
    postAdd,
);

module.exports = router;
