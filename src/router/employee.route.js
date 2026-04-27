const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { employeePolicy } = require("../policies/employee.policies");
const upload = require("../middleware/upload");
const {
    authorize,
    isAllowed
} = require("../middleware/abac");

const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/create.controller");

const { getAll } = require("../controller/employee/get.controller");
const { getWorkDays } = require("../controller/employee/getOne.controller")

router.get("/add", verifyToken, getAdd);

router.get("/getAll", verifyToken, authorize(employeePolicy), getAll);

router.get("/:id", getById);

router.get("/getWorkDays/:id", verifyToken, isAllowed, getWorkDays);

router.post(
    "/add",
    verifyToken,
    upload.single("picture"),
    authorize(employeePolicy, (req) => ({
        house_id: req.body.house_id,
    })),
    postAdd,
);

module.exports = router;
