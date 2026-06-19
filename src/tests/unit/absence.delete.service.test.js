jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getAbsenceById: jest.fn(),
}));

jest.mock("../../model/absence/delete.model", () => ({
    softDeleteAbsenceById: jest.fn(),
}));

const { deleteAbsence } = require("../../service/absence/delete.service");
const { findByIdWithRoleAndHouse } = require("../../model/employee/get.model");
const { getAbsenceById } = require("../../model/absence/get.model");
const { softDeleteAbsenceById } = require("../../model/absence/delete.model");
const RESPONSES = require("../../utils/responses");

describe("absence.delete.service — deleteAbsence", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retorna validation error si el absenceId es inválido", async () => {
        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "no-es-uuid",
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    campo: "absenceId",
                    mensaje: "ID inválido",
                }),
            ]),
        );
    });

    it("retorna USER.NOT_ACCESS si el actor no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue(null);

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
    });

    it("retorna INSUFFICIENT_PERMISSIONS si el actor no tiene rol permitido", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Cuidador" },
        });

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.INSUFFICIENT_PERMISSIONS);
    });

    it("retorna NOT_FOUND si la ausencia no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue(null);

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.NOT_FOUND);
    });

    it("retorna NOT_FOUND si la ausencia ya estaba eliminada", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Administrador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            is_deleted: true,
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
            },
        });

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.NOT_FOUND);
    });

    it("retorna OUT_OF_SCOPE si el coordinador intenta borrar una ausencia de otra casa", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            is_deleted: false,
            employee: {
                employee_id: "employee-1",
                house_id: "house-2",
            },
        });

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.OUT_OF_SCOPE);
    });

    it("soft deletea la ausencia y la regresa mapeada", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            is_deleted: false,
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
            },
        });
        softDeleteAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            absence_type_id: "type-1",
            start: new Date("2026-05-11T00:00:00.000Z"),
            end: new Date("2026-05-13T00:00:00.000Z"),
            description: "Nueva descripción",
            url: "https://example.com/file.pdf",
            is_deleted: true,
            absence_type: { name: "Paternidad" },
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
                name: "Luis",
                surname: "Martínez",
                curp: "MALR900205HDFRRS09",
            },
        });

        const result = await deleteAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        });

        expect(softDeleteAbsenceById).toHaveBeenCalledWith(
            "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
        );

        expect(result).toEqual({
            code: RESPONSES.ABSENCE.DELETED,
            data: {
                absence: {
                    absenceId: "absence-1",
                    employeeId: "employee-1",
                    absenceTypeId: "type-1",
                    name: "Luis Martínez",
                    curp: "MALR900205HDFRRS09",
                    type: "Paternidad",
                    description: "Nueva descripción",
                    link: "https://example.com/file.pdf",
                    startDate: new Date("2026-05-11T00:00:00.000Z"),
                    endDate: new Date("2026-05-13T00:00:00.000Z"),
                    isDeleted: true,
                },
            },
        });
    });
});
