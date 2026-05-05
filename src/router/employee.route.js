const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { authorize } = require("../middleware/abac");
const { apiLimiter } = require("../utils/rateLimit");
const upload = require("../middleware/upload");
const {
    employeePolicy,
    viewDocuments,
    modifyDocuments,
} = require("../policies/employee.policies");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeUpdateController = require("../controller/employee/update.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");

router.get(
  "/update-form",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  employeeUpdateController.getUpdateForm,
);


router.get(
    "/getAll",
    apiLimiter,
    verifyToken,
    requireRole("Admin", "Coordinador"),
    requirePrivileges("viewEmployees"), 
    authorize(employeePolicy),
    employeeGetController.getAll,
);

router.get("/add", 
  apiLimiter, 
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("createEmployees"),
  authorize(employeePolicy, (req) => ({ house_id: req.query.house_id })), 
  employeeGetController.getAdd);

router.get(
  "/employee-detail/:employeeId",
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getEmployeeDetail,
);

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    upload.single("picture"),
    requireRole("Admin", "Coordinador"),
    requirePrivileges("createEmployees"),
    authorize(employeePolicy, (req) => ({ house_id: req.body.house_id })),
    employeeAddController.postAdd,
);

router.get(
    "/document-types",
    apiLimiter,
    verifyToken,
    employeeGetController.getDocumentTypes,
);

router.get(
  "/:id/documents",
  apiLimiter,
  verifyToken,
  requirePrivileges("viewDocuments"),
  authorize(viewDocuments, (req) => ({ employeeId: req.params.id })),
  employeeGetController.getDocumentsByEmployee,
);

router.post(
  "/:id/documents",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  uploadDocs.single("file"),
  employeeUpdateController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  authorize(modifyDocuments),
  employeeDeleteController.deleteDocument,
);

router.get("/:id", 
  apiLimiter, 
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getById);

router.put(
  "/:employeeId/basic-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  employeeUpdateController.updateBasicInfo,
);

router.put(
  "/:employeeId/contact-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  employeeUpdateController.updateContactInfo,
);

router.put(
  "/:employeeId/admin-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  employeeUpdateController.updateAdminInfo,
);

module.exports = router;
