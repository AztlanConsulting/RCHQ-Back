jest.mock("../../model/employee/get.model", () => ({
    findById: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getAbsenceTypeById: jest.fn(),
    getHouseAbsencesInRange: jest.fn(),
}));

jest.mock("../../model/vacation/get.model", () => ({
    getActiveVacationsInRange: jest.fn(),
}));

jest.mock("../../model/absence/create.model", () => ({
    createAbsence: jest.fn(),
}));

jest.mock("../../utils/deleteFile", () => ({
    deleteFileIfExists: jest.fn(),
}));

const { addAbsence } = require("../../service/absence/create.service");
const { findById } = require("../../model/employee/get.model");
const {
    getAbsenceTypeById,
    getHouseAbsencesInRange,
} = require("../../model/absence/get.model");
const { getActiveVacationsInRange } = require("../../model/vacation/get.model");
const { createAbsence } = require("../../model/absence/create.model");
const { deleteFileIfExists } = require("../../utils/deleteFile");
const RESPONSES = require("../../utils/responses");

const IDS = {
    actor: "47bc8d27-cf8c-4da1-a8d9-e777a6d0930f",
    target: "2c359e9f-3cdf-43c0-a151-f7e2dcde2fb4",
    type: "6eb8e341-d92e-460c-a6f3-e2a25a1ec8f6",
};

const validBody = (overrides = {}) => ({
    absenceTypeId: IDS.type,
    startDate: "2026-06-20",
    endDate: "2026-06-21",
    description: "Consulta medica programada",
    ...overrides,
});

const setupSuccessMocks = () => {
    findById.mockImplementation((employeeId) => {
        if (employeeId === IDS.actor) {
            return Promise.resolve({
                employee_id: IDS.actor,
                house_id: "house-1",
                is_active: true,
            });
        }

        if (employeeId === IDS.target) {
            return Promise.resolve({
                employee_id: IDS.target,
                house_id: "house-1",
                is_active: true,
            });
        }

        return Promise.resolve(null);
    });
    getAbsenceTypeById.mockResolvedValue({
        absence_type_id: IDS.type,
        name: "Médica",
    });
    getActiveVacationsInRange.mockResolvedValue([]);
    getHouseAbsencesInRange.mockResolvedValue([]);
    createAbsence.mockResolvedValue({
        absence_id: "absence-1",
        absence_type_id: IDS.type,
        start: new Date("2026-06-20T00:00:00.000Z"),
        end: new Date("2026-06-21T00:00:00.000Z"),
        description: "Consulta medica programada",
        url: null,
        is_deleted: false,
        absence_type: { name: "Médica" },
        employee: {
            employee_id: IDS.target,
            house_id: "house-1",
            name: "Luis",
            surname: "Martínez",
            curp: "MALR900205HDFRRS09",
        },
    });
};

describe("absence.create.service — addAbsence", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-17T12:00:00.000Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        setupSuccessMocks();
    });

    it("retorna validation error si no se registra empleado", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Campo obligatorio");
    });

    it.each([
        ["absenceTypeId", "tipo de ausencia"],
        ["startDate", "fecha de inicio"],
        ["endDate", "fecha de fin"],
        ["description", "descripción"],
    ])("retorna Campo obligatorio si falta %s", async (field) => {
        const body = validBody();
        delete body[field];

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body,
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Campo obligatorio");
        expect(createAbsence).not.toHaveBeenCalled();
    });

    it("rechaza fecha de fin mayor a un año", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ endDate: "2027-05-18" }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Fecha de fin no puede ser mayor a un año");
    });

    it("rechaza fecha de inicio menor a un mes", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ startDate: "2026-06-16", endDate: "2026-06-17" }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Fecha de inicio no puede ser menor a un mes");
    });

    it.each([
        ["2026-07-10", "2026-07-09"],
        ["2026-07-12", "2026-07-11"],
    ])("rechaza fecha de inicio mayor a fin", async (startDate, endDate) => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ startDate, endDate }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Fecha de inicio no puede mayor a la de fin");
    });

    it("rechaza formato de fecha diferente a YYYY-MM-DD", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ startDate: "2026/06/20" }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Fecha solo puede tener un formato YYYY-MM-DD");
    });

    it("rechaza fecha con tamaño diferente a 10 caracteres", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ startDate: "2026-6-20" }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("El tamaño de la fecha debe ser de 10 caracteres");
    });

    it("rechaza descripción mayor a 200 caracteres", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ description: "a".repeat(201) }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Descripción no puede ser mayor a 200 caracteres");
    });

    it("rechaza descripción con emojis", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ description: "Reposo médico 😀" }),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Descripción no permite caracteres especiales");
    });

    it("retorna usuario no encontrado si el empleado no existe", async () => {
        findById.mockImplementation((employeeId) => {
            if (employeeId === IDS.actor) {
                return Promise.resolve({
                    employee_id: IDS.actor,
                    house_id: "house-1",
                    is_active: true,
                });
            }
            return Promise.resolve(null);
        });

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        expect(createAbsence).not.toHaveBeenCalled();
    });

    it("retorna usuario no encontrado si el empleado está dado de baja", async () => {
        findById.mockImplementation((employeeId) => {
            if (employeeId === IDS.actor) {
                return Promise.resolve({
                    employee_id: IDS.actor,
                    house_id: "house-1",
                    is_active: true,
                });
            }
            return Promise.resolve({
                employee_id: IDS.target,
                house_id: "house-1",
                is_active: false,
            });
        });

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
    });

    it("retorna tipo de ausencia no encontrado si el tipo no existe", async () => {
        getAbsenceTypeById.mockResolvedValue(null);

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.INVALID_TYPE);
    });

    it("rechaza si hay empalme con vacaciones", async () => {
        getActiveVacationsInRange.mockResolvedValue([
            {
                vacations_request_id: "vacation-1",
                start: new Date("2026-06-20T00:00:00.000Z"),
                end: new Date("2026-06-21T00:00:00.000Z"),
            },
        ]);

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.VACATION.ALREADY_REQUEST);
    });

    it("rechaza si ya hay 10 ausencias registradas en una fecha del rango", async () => {
        getHouseAbsencesInRange.mockResolvedValue(
            Array.from({ length: 10 }, () => ({
                start: new Date("2026-06-20T00:00:00.000Z"),
                end: new Date("2026-06-20T00:00:00.000Z"),
            })),
        );

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.LIMIT_REACHED);
    });

    it("rechaza formato inválido de evidencia", async () => {
        const file = {
            path: "uploads/documents/evidence.txt",
            filename: "evidence.txt",
            mimetype: "text/plain",
            size: 100,
        };

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
            file,
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("Formato invalido de ausencias");
        expect(deleteFileIfExists).toHaveBeenCalledWith(file.path);
    });

    it("rechaza evidencia mayor a 10mb", async () => {
        const file = {
            path: "uploads/documents/evidence.pdf",
            filename: "evidence.pdf",
            mimetype: "application/pdf",
            size: 10 * 1024 * 1024 + 1,
        };

        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
            file,
        });

        expect(result.code).toBe(RESPONSES.ABSENCE.VALIDATION_ERROR);
        expect(result.message).toBe("tamaño superior a 10mb");
        expect(deleteFileIfExists).toHaveBeenCalledWith(file.path);
    });

    it("registra ausencia sin evidencia", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody(),
        });

        expect(createAbsence).toHaveBeenCalledWith({
            employee_id: IDS.target,
            absence_type_id: IDS.type,
            start: new Date("2026-06-20T00:00:00.000Z"),
            end: new Date("2026-06-21T00:00:00.000Z"),
            description: "Consulta medica programada",
            url: null,
            is_deleted: false,
        });
        expect(result.code).toBe(RESPONSES.ABSENCE.CREATED);
    });

    it("registra ausencia con evidencia", async () => {
        const result = await addAbsence({
            actorEmployeeId: IDS.actor,
            targetEmployeeId: IDS.target,
            body: validBody({ hasEvidenceFile: true }),
            file: {
                path: "uploads/documents/evidence.pdf",
                filename: "evidence.pdf",
                mimetype: "application/pdf",
                size: 100,
            },
        });

        expect(createAbsence).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "uploads/documents/evidence.pdf",
            }),
        );
        expect(result.code).toBe(RESPONSES.ABSENCE.CREATED);
    });
});
