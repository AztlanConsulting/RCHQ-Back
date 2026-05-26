jest.mock("../../model/employee/get.model", () => ({
    findByIdWithRoleAndHouse: jest.fn(),
    getWorkDays: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getAbsenceById: jest.fn(),
    getAbsenceTypeById: jest.fn(),
}));

jest.mock("../../model/absence/update.model", () => ({
    updateAbsenceById: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getGlobalEventsInRange: jest.fn(),
    getHouseEventsInRange: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getActiveVacationsInRange: jest.fn(),
}));

jest.mock("../../utils/deleteFile", () => ({
    deleteFileIfExists: jest.fn(),
}));

const { updateAbsence } = require("../../service/absence/update.service");
const {
    findByIdWithRoleAndHouse,
    getWorkDays,
} = require("../../model/employee/get.model");
const {
    getAbsenceById,
    getAbsenceTypeById,
} = require("../../model/absence/get.model");
const {
    updateAbsenceById,
} = require("../../model/absence/update.model");
const {
    getGlobalEventsInRange,
    getHouseEventsInRange,
} = require("../../model/event/get.model");
const {
    getActiveVacationsInRange,
} = require("../../model/vacation/get.model");
const RESPONSES = require("../../utils/responses");
const { deleteFileIfExists } = require("../../utils/deleteFile");

const mondayToFridayWorkDays = [
    { workday: { name: "Lunes" } },
    { workday: { name: "Martes" } },
    { workday: { name: "Miércoles" } },
    { workday: { name: "Jueves" } },
    { workday: { name: "Viernes" } },
];

const dateOnly = (date) => date.toISOString().split("T")[0];

const todayUTC = () => {
    const today = new Date();

    return new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
    ));
};

const dateFromTodayUTC = ({ years = 0, months = 0, days = 0 }) => {
    const today = todayUTC();

    return new Date(Date.UTC(
        today.getUTCFullYear() + years,
        today.getUTCMonth() + months,
        today.getUTCDate() + days,
    ));
};

describe("absence.update.service — updateAbsence", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getWorkDays.mockResolvedValue(mondayToFridayWorkDays);
        getGlobalEventsInRange.mockResolvedValue([]);
        getHouseEventsInRange.mockResolvedValue([]);
        getActiveVacationsInRange.mockResolvedValue([]);
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

    it("retorna validation error si la fecha de inicio es menor a un mes antes del día actual", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: dateOnly(dateFromTodayUTC({ months: -1, days: -1 })),
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    campo: "body.startDate",
                    mensaje: "Fecha de inicio no puede ser menor a un mes antes del día actual",
                }),
            ]),
        );
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    it("retorna validation error si la fecha de fin queda 100 años atrás", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                endDate: dateOnly(dateFromTodayUTC({ years: -100 })),
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    campo: "body.endDate",
                    mensaje: "Fecha de fin no puede ser menor a un mes antes del día actual",
                }),
            ]),
        );
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    it("retorna validation error si la fecha de fin es mayor a un año después del día actual", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                endDate: dateOnly(dateFromTodayUTC({ years: 1, days: 1 })),
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    campo: "body.endDate",
                    mensaje: "Fecha de fin no puede ser mayor a un año después del día actual",
                }),
            ]),
        );
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    it("permite actualizar solo la evidencia del archivo", async () => {
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
            url: "uploads/documents/evidencia-anterior.pdf",
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
        updateAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            absence_type_id: "type-1",
            start: new Date("2026-05-10T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            description: "Vieja",
            url: "uploads/documents/evidencia-nueva.pdf",
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

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: { hasEvidenceFile: true },
            file: {
                filename: "evidencia-nueva.pdf",
                path: "uploads/documents/evidencia-nueva.pdf",
            },
        });

        expect(updateAbsenceById).toHaveBeenCalledWith(
            "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            {
                url: "uploads/documents/evidencia-nueva.pdf",
            },
        );
        expect(deleteFileIfExists).toHaveBeenCalledWith("uploads/documents/evidencia-anterior.pdf");
        expect(result.code).toBe(RESPONSES.ABSENCE.UPDATED);
        expect(result.data.absence.link).toBe("uploads/documents/evidencia-nueva.pdf");
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
            role: { name: "Administrador" },
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

    it("retorna ALREADY_REQUEST si al modificar se traslapa con vacaciones activas", async () => {
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
            url: null,
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
        getActiveVacationsInRange.mockResolvedValue([
            {
                vacations_request_id: "vac-1",
                start: new Date("2026-05-11T00:00:00.000Z"),
                end: new Date("2026-05-11T00:00:00.000Z"),
            },
        ]);

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            requesterHouseId: "house-1",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: "2026-05-11",
                endDate: "2026-05-13",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
        expect(updateAbsenceById).not.toHaveBeenCalled();
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

    it("manda error si dentro de la solicitud no hay días hábiles", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            employee_id: "employee-1",
            start: new Date("2026-05-11T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
            },
        });

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: "2026-06-20",
                endDate: "2026-06-21",
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.NULL_DATES);
        expect(updateAbsenceById).not.toHaveBeenCalled();
    });

    it("modifica si queda al menos un día usado después de un evento libre", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            employee_id: "employee-1",
            absence_type_id: "type-1",
            start: new Date("2026-05-11T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            description: "Vieja",
            url: "",
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
        getHouseEventsInRange.mockResolvedValueOnce([
            {
                start: new Date("2026-06-22T06:00:00.000Z"),
                end: new Date("2026-06-23T05:59:00.000Z"),
                isFreeDay: true,
            },
        ]);
        updateAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            absence_type_id: "type-1",
            start: new Date("2026-06-22T00:00:00.000Z"),
            end: new Date("2026-06-23T00:00:00.000Z"),
            description: "Vieja",
            url: "",
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

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            requesterHouseId: "house-1",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.UPDATED);
        expect(updateAbsenceById).toHaveBeenCalledWith(
            "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            {
                start: new Date("2026-06-22T00:00:00.000Z"),
                end: new Date("2026-06-23T00:00:00.000Z"),
            },
        );
    });

    it("manda error si dentro de los días solicitados no hay ningún día hábil", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "actor-1",
            house_id: "house-1",
            role: { name: "Coordinador" },
        });
        getAbsenceById.mockResolvedValue({
            absence_id: "absence-1",
            employee_id: "employee-1",
            start: new Date("2026-05-11T00:00:00.000Z"),
            end: new Date("2026-05-12T00:00:00.000Z"),
            employee: {
                employee_id: "employee-1",
                house_id: "house-1",
            },
        });
        getGlobalEventsInRange.mockResolvedValueOnce([
            {
                start: new Date("2026-06-22T06:00:00.000Z"),
                end: new Date("2026-06-24T05:59:00.000Z"),
                isFreeDay: true,
            },
        ]);

        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: {
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.NULL_DATES);
        expect(updateAbsenceById).not.toHaveBeenCalled();
    });

    it("limpia el archivo nuevo si falla la validación con multipart", async () => {
        const result = await updateAbsence({
            actorEmployeeId: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
            absenceId: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
            body: { hasEvidenceFile: true, description: "Texto inválido!!! ¿vale? 😀 #123" },
            file: {
                filename: "evidencia.pdf",
                path: "uploads/documents/evidencia.pdf",
            },
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(deleteFileIfExists).toHaveBeenCalledWith("uploads/documents/evidencia.pdf");
    });
});
