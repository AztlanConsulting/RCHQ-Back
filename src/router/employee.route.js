const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole, requirePrivileges } = require("../middleware/rbac");
const {
    resolveEmployeeHouse,
    resolveRequesterHouse,
} = require("../middleware/resolvers");
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
    getEmployeeToDeactivate,
} = require("../model/employee/deactivate.model");

const { getWorkDays } = require("../controller/employee/get.controller");

router.get(
    "/update-form",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageEmployees"),
    employeeGetController.getUpdateForm,
);

router.get(
    "/getAll",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("viewEmployees"),
    employeeGetController.getAll,
);

router.get(
    "/add",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("createEmployees"),
    authorize(employeePolicy, (req) => ({ houseId: req.query.house_id })),
    employeeGetController.getAdd,
);

router.get(
    "/employee-detail/:employeeId",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("viewEmployees"),
    employeeGetController.getEmployeeDetail,
);

router.get("/getWorkDays/:id", apiLimiter, verifyToken, isAllowed, getWorkDays);

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    upload.single("picture"),
    requireRole("Administrador", "Coordinador"),
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
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageDocuments"),
    resolveEmployeeHouse,
    authorize(modifyDocuments, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    uploadDocs.single("file"),
    employeeAddController.uploadDocument,
);

router.put(
    "/:id/documents/:field",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageDocuments"),
    resolveEmployeeHouse,
    authorize(modifyDocuments, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    uploadDocs.single("file"),
    employeeUpdateController.updateDocument,
);

router.delete(
    "/:id/documents/:field",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageDocuments"),
    resolveEmployeeHouse,
    authorize(modifyDocuments, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    employeeDeleteController.deleteDocument,
);

router.get(
    "/:id",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("viewEmployees"),
    employeeGetController.getById,
);

router.put(
    "/:employeeId/basic-info",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageEmployees"),
    resolveEmployeeHouse,
    authorize(modifyEmployee, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    employeeUpdateController.updateBasicInfo,
);

router.put(
    "/:employeeId/contact-info",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageEmployees"),
    resolveEmployeeHouse,
    authorize(modifyEmployee, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    employeeUpdateController.updateContactInfo,
);

router.put(
    "/:employeeId/admin-info",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    requirePrivileges("manageEmployees"),
    resolveEmployeeHouse,
    authorize(modifyEmployee, (req) => ({
        houseId: req.resolvedEmployee.houseId,
    })),
    employeeUpdateController.updateAdminInfo,
);

router.patch(
    "/:employeeId/deactivate",
    apiLimiter,
    verifyToken,
    requireRole("Administrador", "Coordinador"),
    resolveRequesterHouse,
    validate(deactivateEmployeeParamsSchema, "params"),
    validate(deactivateEmployeeSchema, "body"),
    authorize(deactivateEmployeePolicy, async (req) => {
        const employee = await getEmployeeToDeactivate(req.params.employeeId);
        return employee
            ? { ...employee, addToBlacklist: req.body.addToBlacklist }
            : null;
    }),
    deactivateEmployeeController,
);

module.exports = router;
