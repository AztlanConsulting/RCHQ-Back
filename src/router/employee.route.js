const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { authorize } = require("../middleware/abac");
const upload = require("../middleware/upload");
const {
  employeePolicy,
  viewDocuments,
  modifyDocuments,
} = require("../policies/employee.policies");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");

router.get("/getAll", 
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"), 
  authorize(employeePolicy), 
  employeeGetController.getAll
);

router.get("/add", 
  verifyToken, 
  employeeGetController.getAdd
);

router.get(
  "/employee-detail/:employeeId",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getEmployeeDetail,
);

router.post(
  "/add",
  verifyToken,
  upload.single("picture"),
  authorize(employeePolicy, (req) => ({ house_id: req.body.house_id })),
  employeeAddController.postAdd,
);

router.get(
  "/:id/documents",
  verifyToken,
  requirePrivileges("viewDocuments"),
  authorize(viewDocuments, (req) => ({ employeeId: req.params.id })),
  employeeGetController.getDocumentsByEmployee,
);

router.post(
  "/:id/documents",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeAddController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  employeeDeleteController.deleteDocument,
);

router.get("/:id", employeeGetController.getById);

module.exports = router;
