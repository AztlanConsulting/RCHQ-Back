const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});

const upload = multer({ storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Solo se permiten imágenes con formato JPEG, PNG y JPG"));
        }

        cb(null, true);
    },
 });

module.exports = upload;