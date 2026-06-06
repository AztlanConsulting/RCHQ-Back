const {
    DEFAULT_PASSWORD_LENGTH,
    generateRandomPassword,
} = require("../../utils/randomPassword");

describe("generateRandomPassword", () => {
    it("genera una contraseña con la longitud por defecto", () => {
        const password = generateRandomPassword();

        expect(password).toHaveLength(DEFAULT_PASSWORD_LENGTH);
    });

    it("genera una contraseña con la longitud indicada", () => {
        const password = generateRandomPassword(20);

        expect(password).toHaveLength(20);
    });

    it("rechaza longitudes inválidas", () => {
        expect(() => generateRandomPassword(0)).toThrow(
            "La longitud de la contraseña debe ser un entero positivo",
        );
    });
});
