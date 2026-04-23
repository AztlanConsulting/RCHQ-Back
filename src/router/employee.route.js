const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const { createEmployeePolicy } = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");

const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/employeeAdd.controller");

router.get("/add", verifyToken, getAdd);

router.get("/:id", getById);

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
