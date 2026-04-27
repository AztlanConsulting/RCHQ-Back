const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { authorize } = require("../middleware/abac");
const { createEmployeePolicy } = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");
const employeeController = require("../controller/employee.controller");

const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/employeeAdd.controller");

const router = express.Router();

router.get("/add", verifyToken, getAdd);

router.get("/:id", getById);

router.get(
  "/employee-detail/:employeeID",
  verifyToken,
  requireRole("admin"),
  // authorize(),
  employeeController.getEmployeeDetail,
  );

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
