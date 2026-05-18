const multer = require("multer");

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            error: "El archivo excede el tamaño permitido (5MB)",
        });
    }

    if (err.message && /solo se permiten archivos/i.test(err.message)) {
        return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: err.message,
    });
};

module.exports = errorHandler;
