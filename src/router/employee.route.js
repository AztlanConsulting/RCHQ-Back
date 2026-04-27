const express = require("express");
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { authorize } = require("../middleware/abac");
const { employeePolicy } = require("../policies/employee.policies");
const upload = require("../middleware/upload");
const employeeController = require("../controller/employee.controller");

const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/create.controller");

const { getAll } = require("../controller/employee/get.controller");

const router = express.Router();

router.get("/add", verifyToken, getAdd);

router.get("/getAll", verifyToken, authorize(employeePolicy), getAll);

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
    authorize(employeePolicy, (req) => ({
        house_id: req.body.house_id,
    })),
    postAdd,
);

module.exports = router;
