const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const { resolveEmployeeHouse, resolveRequesterHouse } = require("../middleware/resolvers");
const { apiLimiter } = require("../utils/rateLimit");
const upload = require("../middleware/upload");
const { authorize, isAllowed } = require("../middleware/abac");

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
const {
    deactivateEmployeeController,
} = require("../controller/employee/deactivate.controller");
const {
    deactivateEmployeeSchema,
    deactivateEmployeeParamsSchema,
} = require("../schemas/employee/deactivate.schemas");
const {
    deactivateEmployeePolicy,
} = require("../policies/deactivateEmployee.policies");
const validate = require("../middleware/validate");
const {
    buildCurpReasonValidationMessage,
} = require("../utils/validationMessages");
const {
    getEmployeeToDeactivate,
} = require("../model/employee/deactivate.model");

const { getWorkDays } = require("../controller/employee/get.controller");
const { ROLES } = require("../utils/roles");
const PRIVILEGES = require("../utils/privileges");

router.get(
  "/update-form",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
  employeeGetController.getUpdateForm,
);

router.get(
  "/getAll",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.VIEW_EMPLOYEES),
  employeeGetController.getAll,
);

router.get(
  "/add",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.CREATE_EMPLOYEES),
  authorize(employeePolicy, (req) => ({ houseId: req.query.house_id })),
  employeeGetController.getAdd,
);

router.get(
  "/employee-detail/:employeeId",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.VIEW_EMPLOYEES),
  authorize(employeePolicy, (req) => ({ houseId: req.query.house_id })),
  employeeGetController.getEmployeeDetail,
);

router.get("/getWorkDays/:id", apiLimiter, verifyToken, isAllowed, getWorkDays);

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    upload.single("picture"),
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.CREATE_EMPLOYEES),
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
    requirePrivileges(PRIVILEGES.VIEW_DOCUMENTS),
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
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_DOCUMENTS),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_DOCUMENTS),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  uploadDocs.single("file"),
  employeeUpdateController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_DOCUMENTS),
  resolveEmployeeHouse,
  authorize(modifyDocuments, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeDeleteController.deleteDocument,
);

router.get(
  "/:id",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.VIEW_EMPLOYEES),
  employeeGetController.getById,
);

router.put(
  "/:employeeId/basic-info",
  apiLimiter,
  verifyToken,
  upload.single("picture"),
  requireRole(ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateBasicInfo,
);

router.put(
  "/:employeeId/contact-info",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateContactInfo,
);

router.put(
  "/:employeeId/admin-info",
  apiLimiter,
  verifyToken,
  requireRole(ROLES.COORDINATOR),
  requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
  resolveEmployeeHouse,
  authorize(modifyEmployee, (req) => ({ houseId: req.resolvedEmployee.houseId })),
  employeeUpdateController.updateAdminInfo,
);

router.patch(
    "/:employeeId/deactivate",
    apiLimiter,
    verifyToken,
    requireRole(ROLES.ADMIN, ROLES.COORDINATOR),
    requirePrivileges(PRIVILEGES.MANAGE_EMPLOYEES),
    resolveRequesterHouse,
    validate(deactivateEmployeeParamsSchema, "params"),
    validate(deactivateEmployeeSchema, "body", {
        messageBuilder: buildCurpReasonValidationMessage,
    }),
    authorize(
        deactivateEmployeePolicy,
        async (req) => {
            const employee = await getEmployeeToDeactivate(req.params.employeeId);
                if (employee) req.resolvedEmployee = employee;
            return employee ? { ...employee, addToBlacklist: req.body.addToBlacklist } : null;
        }
    ),
    deactivateEmployeeController,
);

module.exports = router;
