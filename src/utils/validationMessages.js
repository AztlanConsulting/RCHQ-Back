const buildCurpReasonValidationMessage = (issues) => {
    const paths = new Set(
        issues.map((issue) => issue.path.join(".").toLowerCase()).filter(Boolean),
    );

    const hasCurpError = [...paths].some((path) => path.endsWith("curp"));
    const hasReasonError = [...paths].some((path) => path.endsWith("reason"));

    if (hasCurpError && hasReasonError) {
        return "Hay errores de validación en la CURP y en la razón.";
    }

    if (hasCurpError) {
        const curpIssue = issues.find((issue) =>
            issue.path.join(".").toLowerCase().endsWith("curp"),
        );
        return `Error de validación en la CURP: ${curpIssue?.message ?? "verifica el formato ingresado."}`;
    }

    if (hasReasonError) {
        const reasonIssue = issues.find((issue) =>
            issue.path.join(".").toLowerCase().endsWith("reason"),
        );
        return `Error de validación en la razón: ${reasonIssue?.message ?? "verifica el valor capturado."}`;
    }

    return "Error de validación";
};

module.exports = {
    buildCurpReasonValidationMessage,
};
