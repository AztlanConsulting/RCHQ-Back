//router/employee

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { authorize } = require("../middleware/abac");
const {
  employeePolicy,
  viewDocuments,
  modifyDocuments,
} = require("../policies/employee.policies");
const upload = require("../middleware/upload");
const { uploadDocs } = require("../middleware/uploadDocs");
const employeeGetController = require("../controller/employee/get.controller");
const employeeAddController = require("../controller/employee/create.controller");
const employeeDeleteController = require("../controller/employee/delete.controller");
const {
    getById,
    postAdd,
} = require("../controller/employee/create.controller");


router.get("/add", verifyToken, employeeGetController.getAdd);
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

router.get("/getAll", verifyToken, authorize(employeePolicy), employeeGetController.getAll);

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

module.exports = router;
