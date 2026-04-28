const multer = require("multer");
const path = require("path");

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const VALID_DOCUMENT_FIELDS = [
  "cv",
  "birth_certificate",
  "tax_status_certificate",
  "address_certificate",
  "nss",
  "professional_id",
  "education_certificate",
  "medical_certificate",
  "state_criminal_record_certificate",
  "federal_criminal_record_certificate",
  "first_recommendation_letter",
  "second_recommendation_letter",
  "driver_license",
  "signed_regulation",
  "signed_contract",
  "signed_confidential_letter",
  "signed_ethics_letter",
  "induction_manual",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/documents/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const uploadDocs = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Solo se permiten archivos PDF, JPEG, JPG y PNG"),
        false,
      );
    }
    cb(null, true);
  },
});

module.exports = { uploadDocs, VALID_DOCUMENT_FIELDS };
