jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getAbsenceById: jest.fn(),
    getAbsenceTypeById: jest.fn(),
}));

jest.mock("../../model/absence/update.model", () => ({
    updateAbsenceById: jest.fn(),
}));

const { updateAbsence } = require("../../service/absence/update.service");
const { findByIdWithRoleAndHouse } = require("../../model/employee/get.model");
const {
    getAbsenceById,
    getAbsenceTypeById,
} = require("../../model/absence/get.model");
const {
    updateAbsenceById,
} = require("../../model/absence/update.model");
const RESPONSES = require("../../utils/responses");

describe("absence.update.service — updateAbsence", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retorna validation error si el payload está vacío", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {},
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
    });

    it("retorna validation error si la descripción tiene caracteres no permitidos", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: { description: "Texto inválido!!! ¿vale? 😀 #123" },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    campo: "body.description",
                    mensaje: "La descripción solo puede contener letras, números, espacios y signos de interrogación o exclamación",
                }),
            ]),
        );
    });

    it("retorna NOT_FOUND si la ausencia no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue(null);

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: { description: "Nueva descripción" },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.NOT_FOUND);
    });

    it("retorna OUT_OF_SCOPE si el coordinador intenta editar una ausencia de otra casa", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            start: new Date("2026-05-10T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            employee: {
                employee_id: "employee-1",
                house_id: "house-2",
            },
        });

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: { description: "Nueva descripción" },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.OUT_OF_SCOPE);
    });

    it("retorna INVALID_TYPE si el absenceTypeId no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            start: new Date("2026-05-10T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
            },
        });
        getAbsenceTypeById.mockResolvedValue(null);

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                absenceTypeId: "0f9c39f2-6d60-4cdb-a7d3-247e7c1649f7",
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.INVALID_TYPE);
    });

    it("retorna BAD_DATES si el rango final queda invertido", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Admin" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            start: new Date("2026-05-10T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            employee: {
                employee_id: "employee-1",
                house_id: "house-2",
            },
        });

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: "2026-05-20",
            },
        });

        expect(result.code).toBe(RESPONSES.DATES.BAD_DATES);
    });

    it("actualiza la ausencia y la regresa mapeada", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            absence_type_id: "type-1",
            start: new Date("2026-05-10T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            description: "Vieja",
            url: "https://example.com/file.pdf",
            is_deleted: false,
            absence_type: { name: "Médica" },
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
                name: "Luis",
                surname: "Martínez",
                curp: "MALR900205HDFRRS09",
            },
        });
        getAbsenceTypeById.mockResolvedValue({
            absence_type_id: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
            name: "Paternidad",
        });
        updateAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            absence_type_id: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
            start: new Date("2026-05-11T00:00:00.000Z"),
            end: new Date("2026-05-13T00:00:00.000Z"),
            description: "Nueva descripción",
            url: "https://example.com/file.pdf",
            is_deleted: false,
            absence_type: { name: "Paternidad" },
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
                name: "Luis",
                surname: "Martínez",
                curp: "MALR900205HDFRRS09",
            },
        });

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                absenceTypeId: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
                description: "Nueva descripción",
                startDate: "2026-05-11",
                endDate: "2026-05-13",
            },
        });

        expect(updateAbsenceById).toHaveBeenCalledWith(
            "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            {
                absence_type_id: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
                description: "Nueva descripción",
                start: new Date("2026-05-11T00:00:00.000Z"),
                end: new Date("2026-05-13T00:00:00.000Z"),
            },
        );

        expect(result).toEqual({
            code: RESPONSES.ABSENCE.UPDATED,
            data: {
                absence: {
                    absenceId: "absence-1",
                    employeeId: "employee-1",
                    absenceTypeId: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
                    name: "Luis Martínez",
                    curp: "MALR900205HDFRRS09",
                    type: "Paternidad",
                    description: "Nueva descripción",
                    link: "https://example.com/file.pdf",
                    startDate: new Date("2026-05-11T00:00:00.000Z"),
                    endDate: new Date("2026-05-13T00:00:00.000Z"),
                    isDeleted: false,
                },
            },
        });
    });
});
