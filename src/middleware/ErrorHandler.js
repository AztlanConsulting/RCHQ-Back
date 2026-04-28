const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "El archivo excede el tamaño permitido (5MB)",
    });
  }

  res.status(500).json({
    status: 500,
    message: "Error interno del servidor",
    error: err.message,
  });
};
module.exports = errorHandler;
