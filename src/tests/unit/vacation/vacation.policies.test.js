const {
    modifyVacationRequestDates,
} = require("../../../policies/vacation.policies");
const { ROLES } = require("../../../utils/roles");

describe("modifyVacationRequestDates policy", () => {
    const employeeId = "11111111-1111-4111-8111-111111111111";
    const houseId = "22222222-2222-4222-8222-222222222222";

    test("permite modificar si el usuario es dueño de la solicitud", () => {
        const result = modifyVacationRequestDates(
            {
                id: employeeId,
                role: "Mantenimiento",
                houseId: "33333333-3333-4333-8333-333333333333",
            },
            {
                employeeId,
                houseId,
            },
        );

        expect(result).toBe(true);
    });

    test("permite modificar si el usuario es Coordinador de la misma casa", () => {
        const result = modifyVacationRequestDates(
            {
                id: "33333333-3333-4333-8333-333333333333",
                role: ROLES.COORDINATOR,
                houseId,
            },
            {
                employeeId,
                houseId,
            },
        );

        expect(result).toBe(true);
    });

    test("no permite modificar si el usuario no es dueño ni Coordinador", () => {
        const result = modifyVacationRequestDates(
            {
                id: "33333333-3333-4333-8333-333333333333",
                role: "Mantenimiento",
                houseId,
            },
            {
                employeeId,
                houseId,
            },
        );

        expect(result).toBe(false);
    });

    test("no permite modificar si el Coordinador pertenece a otra casa", () => {
        const result = modifyVacationRequestDates(
            {
                id: "33333333-3333-4333-8333-333333333333",
                role: ROLES.COORDINATOR,
                houseId: "44444444-4444-4444-8444-444444444444",
            },
            {
                employeeId,
                houseId,
            },
        );

        expect(result).toBe(false);
    });

    test("no permite modificar si no hay usuario autenticado", () => {
        const result = modifyVacationRequestDates(null, {
            employeeId,
            houseId,
        });

        expect(result).toBe(false);
    });
});
