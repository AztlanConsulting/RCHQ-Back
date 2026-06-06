const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[char];
    });

exports.buildWelcomeEmail = ({ name, surname, email, temporaryPassword }) => `
    <p>Hola ${escapeHtml(name)} ${escapeHtml(surname)},</p>
    <p>Tu cuenta en TOCHAN fue creada correctamente.</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Contraseña temporal:</strong> ${escapeHtml(temporaryPassword)}</p>
    <p>Por seguridad, cambia tu contraseña en tu primer inicio de sesión.</p>
`;
