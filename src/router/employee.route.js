const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveEmployeeHouse } = require("../middleware/resolvers");
const { apiLimiter } = require("../utils/rateLimit");
const upload = require("../middleware/upload");
const {
    authorize,
    isAllowed
} = require("../middleware/abac");

const {
    employeePolicy,
    viewDocuments,
    modifyDocuments,
    modifyEmployee,
} = require("../policies/employee.policies");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeUpdateController = require("../controller/employee/update.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");

const { getWorkDays } = require("../controller/employee/get.controller");

router.get(
  "/update-form",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  authorize(employeePolicy, (req) => ({ houseId: req.user.houseId })),
  employeeGetController.getUpdateForm,
);

router.get(
  "/getAll",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getAll,
);

router.get(
  "/add",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("createEmployees"),
  authorize(employeePolicy, (req) => ({ houseId: req.query.house_id })),
  employeeGetController.getAdd,
);

router.get(
  "/employee-detail/:employeeId",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getEmployeeDetail,
);

router.get("/getWorkDays/:id",
  apiLimiter,
  verifyToken,
  isAllowed,
  getWorkDays
);

router.post(
  "/add",
  apiLimiter,
  verifyToken,
  upload.single("picture"),
  requireRole("Admin", "Coordinador"),
  requirePrivileges("createEmployees"),
  authorize(employeePolicy, (req) => ({ houseId: req.body.house_id })),
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
  resolveEmployeeHouse,
  authorize(viewDocuments, (req) => ({
    employeeId: req.params.id,
    houseId: req.resolvedEmployee.houseId,
  })),
  employeeGetController.getDocumentsByEmployee,
);

router.post(
  "/:id/documents",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  uploadDocs.single("file"),
  employeeUpdateController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageDocuments"),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeDeleteController.deleteDocument,
);

router.get(
  "/:id",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("viewEmployees"),
  employeeGetController.getById,
);

router.put(
  "/:employeeId/basic-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateBasicInfo,
);

router.put(
  "/:employeeId/contact-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateContactInfo,
);

router.put(
  "/:employeeId/admin-info",
  apiLimiter,
  verifyToken,
  requireRole("Admin", "Coordinador"),
  requirePrivileges("manageEmployees"),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateAdminInfo,
);

module.exports = router;