//router/employee

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const { createEmployeePolicy } = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/employeeGet.controller");
const employeeAddController = require("../controller/employee/employeeAdd.controller");
const employeeDeleteController = require("../controller/employee/employeeDelete.controller");

router.get("/add", verifyToken, employeeGetController.getAdd);
router.get("/:id", employeeGetController.getById);

router.post(
  "/add",
  verifyToken,
  upload.single("picture"),
  authorize(createEmployeePolicy, (req) => ({ house_id: req.body.house_id })),
  employeeAddController.postAdd,
);

// Documentos
router.get(
  "/:id/documents",
  verifyToken,
  employeeGetController.getDocumentsByEmployee,
);

router.post(
  "/:id/documents",
  verifyToken,
  uploadDocs.single("file"),
  employeeAddController.uploadDocument,
);

router.put(
  "/:id/documents/:field",
  verifyToken,
  uploadDocs.single("file"),
  employeeAddController.updateDocument,
);

router.delete(
  "/:id/documents/:field",
  verifyToken,
  employeeDeleteController.deleteDocument,
);

module.exports = router;
