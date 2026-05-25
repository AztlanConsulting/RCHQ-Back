const PDFDocument = require("pdfkit");

const formatMoment = (momentValue) =>
    new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(new Date(momentValue));

exports.buildLogsPdfBuffer = async ({
    houseName,
    logs,
    generatedAt,
}) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        margin: 40,
        size: "A4",
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A");
    doc.text("Reporte de logs por casa");
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(12).fillColor("#334155");
    doc.text(`Casa: ${houseName}`);
    doc.text(`Generado: ${formatMoment(generatedAt)}`);
    doc.text(`Total de registros: ${logs.length}`);
    doc.moveDown();

    if (logs.length === 0) {
        doc.text("No hay logs para incluir en el reporte.");
        doc.end();
        return;
    }

    logs.forEach((log, index) => {
        if (doc.y > 700) {
            doc.addPage();
        }

        doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A");
        doc.text(
            `${index + 1}. ${log.action}${log.important ? " [IMPORTANTE]" : ""}`,
            {
                width: 515,
            },
        );

        doc.moveDown(0.2);
        doc.font("Helvetica").fontSize(10).fillColor("#334155");
        doc.text(`Fecha: ${formatMoment(log.moment)}`, {
            width: 515,
        });
        doc.text(`Responsable: ${log.responsibleName} (${log.responsibleCurp})`, {
            width: 515,
        });
        doc.text(`Afectado: ${log.affectedName || "-"}`, {
            width: 515,
        });
        doc.text(`IP: ${log.ipAddress}`, {
            width: 515,
        });

        doc.moveDown(0.5);
        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .strokeColor("#CBD5E1")
            .lineWidth(1)
            .stroke();
        doc.moveDown(0.8);
    });

    doc.end();
});
