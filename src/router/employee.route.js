const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const upload = require("../middleware/upload");
const { requireRole } = require("../middleware/rbac");
const validate = require("../middleware/validate");
const { deactivateEmployeeController } = require("../controller/employee/deactivate.controller");
const { 
    deactivateEmployeeSchema, 
    deactivateEmployeeParamsSchema
} = require("../schemas/employee/deactivate.schemas");
const { deactivateEmployeePolicy } = require("../policies/deactivateEmployee.policies");
const { getEmployeeToDeactivate } = require("../model/employee/deactivate.model");
const {
    getAdd,
    getById,
    postAdd,
} = require("../controller/employee/create.controller");
const { getAll } = require("../controller/employee/get.controller");
const { employeePolicy, viewDocuments, modifyDocuments } = require("../policies/employee.policies");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");

router.get(
    "/add",
    verifyToken,
    getAdd
);

router.get(
    "/getAll",
    verifyToken,
    authorize(employeePolicy),
    getAll
);

router.get(
    "/:id",
    getById
);

router.post(
  "/add",
  verifyToken,
  upload.single("picture"),
  authorize(employeePolicy, (req) => ({ house_id: req.body.house_id })),
  employeeAddController.postAdd,
);

router.patch(
  "/:employeeId/deactivate",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  validate(deactivateEmployeeParamsSchema, "params"),
  validate(deactivateEmployeeSchema),
  authorize(
    deactivateEmployeePolicy,
    (req) => getEmployeeToDeactivate(req.params.employeeId)
  ),
  deactivateEmployeeController
);

router.get(
  "/:id/documents",
  verifyToken,
  authorize(viewDocuments, (req) => ({ employeeId: req.params.id })),
  employeeGetController.getDocumentsByEmployee,
);

router.post(
  "/:id/documents",
  verifyToken,
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  verifyToken,
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeAddController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  verifyToken,
  authorize(modifyDocuments),
  employeeDeleteController.deleteDocument,
);

router.get("/:id", employeeGetController.getById);

module.exports = router;