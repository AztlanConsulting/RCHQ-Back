const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const { employeePolicy } = require("../policies/employee.policies");
const upload = require("../middleware/upload");
const { requireRole } = require("../middleware/role");
const { validate } = require("../middleware/validate");
const { deactivateEmployeeController } = require("../controller/employee/deactivate.controller");
const { deactivateEmployeeSchema } = require("../schemas/employee.schema");
const { deactivateEmployeePolicy } = require("../policies/deactivateEmployee.policies");
const { getEmployeeToDeactivate } = require("../model/employee/deactivate.model");



const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/create.controller");

const { getAll } = require("../controller/employee/get.controller");

router.get("/add", verifyToken, getAdd);

router.get("/getAll", verifyToken, authorize(employeePolicy), getAll);

router.get("/:id", getById);

router.post(
    "/add",
    verifyToken,
    upload.single("picture"),
    authorize(employeePolicy, (req) => ({
        house_id: req.body.house_id,
    })),
    postAdd,
);

router.patch(
  "/:employeeId/deactivate",
  verifyToken,
  requireRole("Administrador", "Coordinador"),
  validate(deactivateEmployeeSchema),
  authorize(
    deactivateEmployeePolicy,
    (req) => getEmployeeToDeactivate(req.params.employeeId)
  ),
  deactivateEmployeeController
);

module.exports = router;
