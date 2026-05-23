jest.mock("../../model/logs/get.model", () => ({
    getLogsByHousePage: jest.fn(),
    getLogsByHouseBaseWhere: jest.fn((houseId) => ({
        employee: {
            house_id: houseId,
        },
    })),
    getLogsByHouse: jest.fn(),
    getEmployeeIdsBySearch: jest.fn(),
    getLogActions: jest.fn(),
    getAffectedEmployeesByIds: jest.fn(),
}));

jest.mock("../../model/house/get.model", () => ({
    getHouseById: jest.fn(),
    getHousesByIds: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getEventsByIds: jest.fn(),
}));

jest.mock("../../utils/logIp", () => ({
    readLogIp: jest.fn((value) => `decoded:${value}`),
}));

jest.mock("../../utils/dates", () => ({
    convertUTCToMexicanTime: jest.fn((timestamp) => timestamp),
}));

jest.mock("../../utils/logsPdf", () => ({
    buildLogsPdfBuffer: jest.fn(),
}));

const {
    getLogsByHouse,
    getLogsPdfByHouse,
    getLogsActions,
} = require("../../service/logs/get.service");
const {
    getLogsByHousePage,
    getEmployeeIdsBySearch,
    getLogActions,
    getLogsByHouse: getLogsByHouseModel,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const {
    getHouseById,
    getHousesByIds,
} = require("../../model/house/get.model");
const { getEventsByIds } = require("../../model/event/get.model");
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

    it("retorna INVALID_PAGINATION con rango de fechas inválido", async () => {
        const result = await getLogsByHouse(
            "house-1",
            "1",
            "6",
            "",
            "",
            "2026-05-11",
            "2026-05-10",
        );

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
        getHousesByIds.mockResolvedValue([]);
        getEventsByIds.mockResolvedValue([]);

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
        expect(getHousesByIds).toHaveBeenCalledWith([]);
        expect(getEventsByIds).toHaveBeenCalledWith([]);
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
                {
                    log_id: "log-3",
                    affected: "a0000001-0000-4000-8000-000000000001",
                    ip_address: "hashed-ip-3",
                    moment,
                    action: {
                        description: "Actualización de ausencia exitosa",
                        important: false,
                    },
                    employee: {
                        employee_id: "emp-3",
                        name: "Sofía",
                        surname: "Neri",
                        curp: "NESO900101MDFMNS03",
                        picture: null,
                    },
                },
                {
                    log_id: "log-4",
                    affected: "c3000000-0000-4000-8000-000000000003",
                    ip_address: "hashed-ip-4",
                    moment,
                    action: {
                        description: "Actualización de ausencia exitosa",
                        important: false,
                    },
                    employee: {
                        employee_id: "emp-4",
                        name: "Elena",
                        surname: "Soto",
                        curp: "SOEL900101MDFMNS04",
                        picture: null,
                    },
                },
            ],
            totalRecords: 4,
        });

        getAffectedEmployeesByIds.mockResolvedValue([
            {
                employee_id: "11111111-1111-4111-8111-111111111111",
                name: "María",
                surname: "López",
            },
        ]);
        getHousesByIds.mockResolvedValue([
            {
                house_id: "a0000001-0000-4000-8000-000000000001",
                name: "Desarrollo",
            },
        ]);
        getEventsByIds.mockResolvedValue([
            {
                id: "c3000000-0000-4000-8000-000000000003",
                name: "Visita médica",
            },
        ]);

        const result = await getLogsByHouse("house-1", "1", "6");

        expect(result.code).toBe(RESPONSES.LOGS.FOUND);
        expect(result.data.totalPages).toBe(1);
        expect(result.data.currentPage).toBe(1);
        expect(result.data.totalRecords).toBe(4);
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
            {
                logId: "log-3",
                responsibleEmployeeId: "emp-3",
                responsibleName: "Sofía Neri",
                responsibleCurp: "NESO900101MDFMNS03",
                responsiblePicture: null,
                affectedName: "Desarrollo",
                ipAddress: "decoded:hashed-ip-3",
                action: "Actualización de ausencia exitosa",
                important: false,
                moment,
            },
            {
                logId: "log-4",
                responsibleEmployeeId: "emp-4",
                responsibleName: "Elena Soto",
                responsibleCurp: "SOEL900101MDFMNS04",
                responsiblePicture: null,
                affectedName: "Visita médica",
                ipAddress: "decoded:hashed-ip-4",
                action: "Actualización de ausencia exitosa",
                important: false,
                moment,
            },
        ]);
        expect(readLogIp).toHaveBeenCalledTimes(4);
    });

    it("filtra logs por acciones y nombre", async () => {
        getEmployeeIdsBySearch.mockResolvedValue(["emp-1"]);
        getLogsByHousePage.mockResolvedValue({
            logs: [],
            totalRecords: 0,
        });
        getAffectedEmployeesByIds.mockResolvedValue([]);

        await getLogsByHouse("house-1", "1", "6", "empl-001,ausn-001", "Car");

        expect(getEmployeeIdsBySearch).toHaveBeenCalledWith("house-1", "Car");
        expect(getLogsByHousePage).toHaveBeenCalledWith(
            {
                employee: {
                    house_id: "house-1",
                },
                action_id: {
                    in: ["empl-001", "ausn-001"],
                },
                AND: [
                    {
                        OR: [
                            {
                                employee_id: {
                                    in: ["emp-1"],
                                },
                            },
                            {
                                affected: {
                                    in: ["emp-1"],
                                },
                            },
                            {
                                affected: {
                                    contains: "Car",
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                ],
            },
            0,
            6,
        );
    });

    it("filtra logs por responsable y afectado de forma separada", async () => {
        getEmployeeIdsBySearch
            .mockResolvedValueOnce(["emp-responsible"])
            .mockResolvedValueOnce(["emp-affected"]);
        getLogsByHousePage.mockResolvedValue({
            logs: [],
            totalRecords: 0,
        });
        getAffectedEmployeesByIds.mockResolvedValue([]);

        await getLogsByHouse(
            "house-1",
            "1",
            "6",
            "",
            "",
            "",
            "",
            "Carla",
            "Luis",
        );

        expect(getEmployeeIdsBySearch).toHaveBeenNthCalledWith(1, "house-1", "Carla");
        expect(getEmployeeIdsBySearch).toHaveBeenNthCalledWith(2, "house-1", "Luis");
        expect(getLogsByHousePage).toHaveBeenCalledWith(
            {
                employee: {
                    house_id: "house-1",
                },
                AND: [
                    {
                        employee_id: {
                            in: ["emp-responsible"],
                        },
                    },
                    {
                        OR: [
                            {
                                affected: {
                                    in: ["emp-affected"],
                                },
                            },
                            {
                                affected: {
                                    contains: "Luis",
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                ],
            },
            0,
            6,
        );
    });

    it("filtra logs por rango de fechas", async () => {
        getLogsByHousePage.mockResolvedValue({
            logs: [],
            totalRecords: 0,
        });
        getAffectedEmployeesByIds.mockResolvedValue([]);

        await getLogsByHouse(
            "house-1",
            "1",
            "6",
            "",
            "",
            "2026-05-09",
            "2026-05-10",
        );

        expect(getLogsByHousePage).toHaveBeenCalledWith(
            {
                employee: {
                    house_id: "house-1",
                },
                moment: {
                    gte: new Date("2026-05-09T00:00:00.000Z"),
                    lte: new Date("2026-05-10T23:59:59.999Z"),
                },
            },
            0,
            6,
        );
    });

    it("retorna acciones de logs para el filtro", async () => {
        getLogActions.mockResolvedValue([
            {
                action_id: "empl-001",
                description: "Empleado creado",
            },
            {
                action_id: "ausn-001",
                description: "Actualización de ausencia exitosa",
            },
        ]);

        const result = await getLogsActions();

        expect(result).toEqual({
            code: RESPONSES.LOGS.ACTIONS_FOUND,
            data: [
                {
                    actionId: "empl-001",
                    description: "Empleado creado",
                },
                {
                    actionId: "ausn-001",
                    description: "Actualización de ausencia exitosa",
                },
            ],
        });
    });

    it("genera el reporte pdf con el nombre de la casa", async () => {
        const moment = new Date("2026-05-01T12:00:00.000Z");
        const pdfBuffer = Buffer.from("%PDF-test");

        getLogsByHouseModel.mockResolvedValue([
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
        getHousesByIds.mockResolvedValue([]);
        getEventsByIds.mockResolvedValue([]);
        buildLogsPdfBuffer.mockResolvedValue(pdfBuffer);

        const result = await getLogsPdfByHouse("house-1", 2026, 2026);

        expect(result.code).toBe(RESPONSES.LOGS.PDF_CREATED);
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
        });
        expect(result.data.pdfBuffer).toBe(pdfBuffer);
        expect(result.data.fileName).toBe("reporte-logs-2026-2026.pdf");
    });

});
