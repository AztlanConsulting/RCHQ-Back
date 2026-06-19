const {
    getRequiredContractTypeForRole,
    isContractTypeAllowedForRole,
    getAllowedContractTypesForRole,
    resolveContractTypeForRole,
    buildRoleContractMismatchMessage,
} = require("../../utils/roleContractRules");
const { ROLES } = require("../../utils/roles");

describe("roleContractRules", () => {
    it("exige Proveedor para el puesto Proveedor", () => {
        expect(getRequiredContractTypeForRole(ROLES.SUPPLIER)).toBe("Proveedor");
        expect(isContractTypeAllowedForRole(ROLES.SUPPLIER, "Proveedor")).toBe(true);
        expect(isContractTypeAllowedForRole(ROLES.SUPPLIER, "Nomina")).toBe(false);
    });

    it("exige Patronato para puestos de patronato", () => {
        [ROLES.PRESIDENT, ROLES.VICE_PRESIDENT, ROLES.TREASURER, ROLES.VOCAL].forEach(
            (roleName) => {
                expect(getRequiredContractTypeForRole(roleName)).toBe("Patronato");
                expect(isContractTypeAllowedForRole(roleName, "Patronato")).toBe(true);
                expect(isContractTypeAllowedForRole(roleName, "Proveedor")).toBe(false);
            },
        );
    });

    it("no restringe contratos para puestos operativos", () => {
        expect(getRequiredContractTypeForRole(ROLES.MAINTENANCE)).toBeNull();
        expect(isContractTypeAllowedForRole(ROLES.MAINTENANCE, "Nomina")).toBe(true);
        expect(getAllowedContractTypesForRole(ROLES.MAINTENANCE).length).toBeGreaterThan(2);
    });

    it("resuelve el contrato forzado al cambiar puesto", () => {
        expect(resolveContractTypeForRole(ROLES.PRESIDENT, "Nomina")).toBe("Patronato");
        expect(resolveContractTypeForRole(ROLES.SUPPLIER, "Patronato")).toBe("Proveedor");
        expect(resolveContractTypeForRole(ROLES.MAINTENANCE, "Honorarios")).toBe("Honorarios");
    });

    it("genera mensaje de error descriptivo", () => {
        expect(buildRoleContractMismatchMessage("Presidente", "Patronato")).toBe(
            "El puesto Presidente requiere contrato Patronato",
        );
    });
});
