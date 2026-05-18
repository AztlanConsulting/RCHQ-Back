jest.mock("../../model/logs/get.model", () => ({
    getLogsByHousePage: jest.fn(),
    getAffectedEmployeesByIds: jest.fn(),
}));

jest.mock("../../model/house/get.model", () => ({
    getHousesByIds: jest.fn(),
}));

jest.mock("../../model/event/get.model", () => ({
    getEventsByIds: jest.fn(),
}));

jest.mock("../../utils/logIp", () => ({
    readLogIp: jest.fn((value) => `decoded:${value}`),
}));
const { getLogsByHouse } = require("../../service/logs/get.service");
const {
    getLogsByHousePage,
    getAffectedEmployeesByIds,
} = require("../../model/logs/get.model");
const { getHousesByIds } = require("../../model/house/get.model");
const { getEventsByIds } = require("../../model/event/get.model");
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

});
