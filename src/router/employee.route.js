//router/employee

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const {
  createEmployeePolicy,
  viewDocuments,
  modifyDocuments,
} = require("../policies/employeeAdd.policies");
const upload = require("../middleware/upload");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");

router.get("/add", verifyToken, employeeGetController.getAdd);
router.get("/:id", employeeGetController.getById);

router.post(
  "/add",
  verifyToken,
  upload.single("picture"),
  authorize(createEmployeePolicy, (req) => ({ house_id: req.body.house_id })),
  employeeAddController.postAdd,
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

module.exports = router;
