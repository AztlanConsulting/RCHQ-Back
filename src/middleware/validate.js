const validate = (schema, property = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[property]);

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

        req[property] = result.data;
        next();
    };
};

module.exports = validate;