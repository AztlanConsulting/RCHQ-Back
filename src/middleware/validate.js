const validate = (schema, property = "body") => {
  
  return (req, res, next) => {
    const dataToValidate =
      property === "all"
        ? {
          params: req.params,
          body: req.body,
          query: req.query,
        }
        : req[property];

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (property === "all") {
      req.params = result.data.params ?? req.params;
      req.body = result.data.body ?? req.body;
      req.query = result.data.query ?? req.query;
    } else {
      req[property] = result.data;
    }

    next();
  };
};

module.exports = validate;
