const errorHandler = (err, req, res) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: err.message,
  });
};
module.exports = errorHandler;
