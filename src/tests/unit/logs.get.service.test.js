jest.mock("../../model/logs/get.model", () => ({
    getLogsByHousePage: jest.fn(),
    getLogsByHouse: jest.fn(),
    getLogsByHouseInRange: jest.fn(),
    getAffectedEmployeesByIds: jest.fn(),
}));

jest.mock("../../utils/logIp", () => ({
    readLogIp: jest.fn((value) => `decoded:${value}`),
}));

jest.mock("../../model/house/get.model", () => ({
    getHouseById: jest.fn(),
}));

jest.mock("../../utils/logsPdf", () => ({
    buildLogsPdfBuffer: jest.fn(),
}));

const {
    getLogsByHouse,
    getLogsPdfByHouse,
} = require("../../service/logs/get.service");
const {
    getLogsByHousePage,
    getLogsByHouseInRange,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const { getHouseById } = require("../../model/house/get.model");
const { buildLogsPdfBuffer } = require("../../utils/logsPdf");
const { readLogIp } = require("../../utils/logIp");
const RESPONSES = require("../../utils/responses");

describe("logs.get.service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retorna NOT_PROVIDED si no recibe houseId", async () => {
        const result = await getLogsByHouse();

        expect(result).toEqual({
            code: RESPONSES.LOGS.NOT_PROVIDED,
        });
    });

    it("retorna INVALID_PAGINATION con page inválida", async () => {
        const result = await getLogsByHouse("house-1", "0", "6");

        expect(result).toEqual({
            code: RESPONSES.LOGS.INVALID_PAGINATION,
        });
    });

    it("retorna INVALID_PAGINATION con limit no numérico", async () => {
        const result = await getLogsByHouse("house-1", "1", "abc");

        expect(result).toEqual({
            code: RESPONSES.LOGS.INVALID_PAGINATION,
        });
    });

    it("retorna lista vacía cuando no hay logs", async () => {
        getLogsByHousePage.mockResolvedValue({
            logs: [],
            totalRecords: 0,
        });

        getAffectedEmployeesByIds.mockResolvedValue([]);

        const result = await getLogsByHouse("house-1", "1", "6");

        expect(result).toEqual({
            code: RESPONSES.LOGS.FOUND,
            data: {
                logs: [],
                totalPages: 0,
                currentPage: 1,
                totalRecords: 0,
            },
        });
        expect(getAffectedEmployeesByIds).toHaveBeenCalledWith([]);
    });

    it("retorna logs paginados y mapeados", async () => {
        const moment = new Date("2026-05-01T12:00:00.000Z");

        getLogsByHousePage.mockResolvedValue({
            logs: [
                {
                    log_id: "log-1",
                    affected: "11111111-1111-4111-8111-111111111111",
                    ip_address: "hashed-ip",
                    moment,
                    action: {
                        description: "Empleado creado",
                        important: true,
                    },
                    employee: {
                        employee_id: "emp-1",
                        name: "Ana",
                        surname: "Pérez",
                        curp: "PEGA900101MDFRNN01",
                        picture: "ana.jpg",
                    },
                },
                {
                    log_id: "log-2",
                    affected: "Texto libre",
                    ip_address: "hashed-ip-2",
                    moment,
                    action: {
                        description: "Actualización de ausencia exitosa",
                        important: false,
                    },
                    employee: {
                        employee_id: "emp-2",
                        name: "Luis",
                        surname: "Ramírez",
                        curp: "RALU900101HDFMNS02",
                        picture: null,
                    },
                },
            ],
            totalRecords: 2,
        });

        getAffectedEmployeesByIds.mockResolvedValue([
            {
                employee_id: "11111111-1111-4111-8111-111111111111",
                name: "María",
                surname: "López",
            },
        ]);

        const result = await getLogsByHouse("house-1", "1", "6");

        expect(result.code).toBe(RESPONSES.LOGS.FOUND);
        expect(result.data.totalPages).toBe(1);
        expect(result.data.currentPage).toBe(1);
        expect(result.data.totalRecords).toBe(2);
        expect(result.data.logs).toEqual([
            {
                logId: "log-1",
                responsibleEmployeeId: "emp-1",
                responsibleName: "Ana Pérez",
                responsibleCurp: "PEGA900101MDFRNN01",
                responsiblePicture: "ana.jpg",
                affectedName: "María López",
                ipAddress: "decoded:hashed-ip",
                action: "Empleado creado",
                important: true,
                moment,
            },
            {
                logId: "log-2",
                responsibleEmployeeId: "emp-2",
                responsibleName: "Luis Ramírez",
                responsibleCurp: "RALU900101HDFMNS02",
                responsiblePicture: null,
                affectedName: "Texto libre",
                ipAddress: "decoded:hashed-ip-2",
                action: "Actualización de ausencia exitosa",
                important: false,
                moment,
            },
        ]);
        expect(readLogIp).toHaveBeenCalledTimes(2);
    });

    it("genera el reporte pdf de logs por casa", async () => {
        const moment = new Date("2026-05-01T12:00:00.000Z");
        const pdfBuffer = Buffer.from("%PDF-test");

        getLogsByHouseInRange.mockResolvedValue([
            {
                log_id: "log-1",
                affected: "11111111-1111-4111-8111-111111111111",
                ip_address: "hashed-ip",
                moment,
                action: {
                    description: "Empleado creado",
                    important: true,
                },
                employee: {
                    employee_id: "emp-1",
                    name: "Ana",
                    surname: "Pérez",
                    curp: "PEGA900101MDFRNN01",
                    picture: "ana.jpg",
                },
            },
        ]);
        getHouseById.mockResolvedValue({
            houseId: "house-1",
            name: "Desarrollo",
        });
        getAffectedEmployeesByIds.mockResolvedValue([
            {
                employee_id: "11111111-1111-4111-8111-111111111111",
                name: "María",
                surname: "López",
            },
        ]);
        buildLogsPdfBuffer.mockResolvedValue(pdfBuffer);

        const result = await getLogsPdfByHouse("house-1", "5", "2026");

        expect(result.code).toBe(RESPONSES.LOGS.FOUND);
        expect(getLogsByHouseInRange).toHaveBeenCalledWith(
            "house-1",
            new Date(Date.UTC(2026, 4, 1)),
            new Date(Date.UTC(2026, 5, 1)),
        );
        expect(buildLogsPdfBuffer).toHaveBeenCalledWith({
            houseName: "Desarrollo",
            logs: [
                {
                    logId: "log-1",
                    responsibleEmployeeId: "emp-1",
                    responsibleName: "Ana Pérez",
                    responsibleCurp: "PEGA900101MDFRNN01",
                    responsiblePicture: "ana.jpg",
                    affectedName: "María López",
                    ipAddress: "decoded:hashed-ip",
                    action: "Empleado creado",
                    important: true,
                    moment,
                },
            ],
            generatedAt: expect.any(Date),
            periodLabel: "mayo de 2026",
        });
        expect(result.data.pdfBuffer).toBe(pdfBuffer);
        expect(result.data.fileName).toBe("reporte-logs-house-1-2026-05.pdf");
    });

    it("retorna INVALID_REPORT_DATE si month o year son inválidos", async () => {
        const result = await getLogsPdfByHouse("house-1", "13", "2026");

        expect(result).toEqual({
            code: RESPONSES.LOGS.INVALID_REPORT_DATE,
        });
    });
});
