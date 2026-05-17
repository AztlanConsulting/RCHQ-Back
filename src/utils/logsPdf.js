const PDFDocument = require("pdfkit");

const formatMoment = (momentValue) =>
    new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
    }).format(new Date(momentValue));

exports.buildLogsPdfBuffer = async ({
    houseName,
    logs,
    generatedAt,
    periodLabel,
}) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        margin: 40,
        size: "A4",
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Reporte de logs por casa");
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Casa: ${houseName}`);
    if (periodLabel) {
        doc.text(`Periodo: ${periodLabel}`);
    }
    doc.text(`Generado: ${formatMoment(generatedAt)}`);
    doc.text(`Total de registros: ${logs.length}`);
    doc.moveDown();

    if (logs.length === 0) {
        doc.text("No hay logs para incluir en el reporte.");
        doc.end();
        return;
    }

    logs.forEach((log, index) => {
        doc
            .fontSize(11)
            .text(`${index + 1}. ${log.action}${log.important ? " [IMPORTANTE]" : ""}`);
        doc.fontSize(10).text(`Fecha: ${formatMoment(log.moment)}`);
        doc.text(`Responsable: ${log.responsibleName} (${log.responsibleCurp})`);
        doc.text(`Afectado: ${log.affectedName || "—"}`);
        doc.text(`IP: ${log.ipAddress}`);
        doc.moveDown(0.75);

        if (doc.y > 720 && index < logs.length - 1) {
            doc.addPage();
        }
    });

    doc.end();
});
