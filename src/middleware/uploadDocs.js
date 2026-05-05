const multer = require("multer");
const path = require("path");

const ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
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

module.exports = { uploadDocs };
