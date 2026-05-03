const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
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
    "/getAll",
    apiLimiter,
    verifyToken,
    authorize(employeePolicy),
    employeeGetController.getAll,
);

router.get("/add", apiLimiter, verifyToken, employeeGetController.getAdd);

router.get(
    "/employee-detail/:employeeId",
    verifyToken,
    requireRole("Admin", "Coordinator"),
    employeeGetController.getEmployeeDetail,
);

router.post(
    "/add",
    apiLimiter,
    verifyToken,
    upload.single("picture"),
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
    authorize(viewDocuments, (req) => ({ employeeId: req.params.id })),
    employeeGetController.getDocumentsByEmployee,
);

router.post(
    "/:id/documents",
    apiLimiter,
    verifyToken,
    authorize(modifyDocuments),
    uploadDocs.single("file"),
    employeeAddController.uploadDocument,
);

router.put(
    "/:id/documents/:field",
    apiLimiter,
    verifyToken,
    authorize(modifyDocuments),
    uploadDocs.single("file"),
    employeeUpdateController.updateDocument,
);

router.delete(
    "/:id/documents/:field",
    apiLimiter,
    verifyToken,
    authorize(modifyDocuments),
    employeeDeleteController.deleteDocument,
);

router.get("/:id", apiLimiter, employeeGetController.getById);

module.exports = router;
