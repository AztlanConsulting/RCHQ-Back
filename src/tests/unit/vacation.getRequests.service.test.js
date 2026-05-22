jest.mock("../../../src/model/employee/get.model", () => ({
    getStartDate: jest.fn(),
    findByIdWithRoleAndHouse: jest.fn(),
}));

jest.mock("../../../src/model/vacation/get.model", () => ({
    getVacationsInRange: jest.fn(),
    getPendingVacationRequestsByHouse: jest.fn(),
    getReviewedVacationRequestsByHouse: jest.fn(),
    getVacationRequestsByEmployee: jest.fn(),
    getEligibleVacationEmployees: jest.fn(),
}));

jest.mock("../../../src/utils/pagination", () => ({
    parsePagination: jest.fn(),
    buildPagination: jest.fn(),
}));

jest.mock("../../../src/utils/vacationFilters", () => ({
    buildVacationListWhere: jest.fn(),
    buildVacationDateFilter: jest.fn(),
    buildVacationEmployeeSearchFilter: jest.fn(),
}));

jest.mock("../../../src/utils/mappers/vacation.map", () => ({
    mapReviewedStatus: jest.fn(),
    mapVacationRequestForList: jest.fn(),
}));

const {
    findByIdWithRoleAndHouse,
} = require("../../../src/model/employee/get.model");

const {
    getPendingVacationRequestsByHouse,
    getReviewedVacationRequestsByHouse,
    getVacationRequestsByEmployee,
    getEligibleVacationEmployees: getEligibleVacationEmployeesModel,
} = require("../../../src/model/vacation/get.model");

const {
    parsePagination,
    buildPagination,
} = require("../../../src/utils/pagination");

const {
    buildVacationListWhere,
    buildVacationDateFilter,
    buildVacationEmployeeSearchFilter,
} = require("../../../src/utils/vacationFilters");

const {
    mapReviewedStatus,
    mapVacationRequestForList,
} = require("../../../src/utils/mappers/vacation.map");

const {
    getPendingVacationRequests,
    getReviewedVacationRequests,
    getFutureVacationRequests,
    getPastVacationRequests,
    getEligibleVacationEmployees,
} = require("../../../src/service/vacation/get.service");

const RESPONSES = require("../../../src/utils/responses");
const { VACATION_STATUS } = require("../../../src/utils/vacationStatus");
const { ROLES } = require("../../utils/roles");

describe("US80 - getPendingVacationRequests service", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        parsePagination.mockReturnValue({
            page: 1,
            limit: 6,
            skip: 0,
            take: 6,
        });

        buildPagination.mockReturnValue({
            page: 1,
            limit: 6,
            total: 1,
            totalPages: 1,
        });

        buildVacationListWhere.mockReturnValue({
            status: VACATION_STATUS.PENDING,
            employee: {
                house_id: "a0000001-0000-4000-8000-000000000001",
            },
        });

        mapVacationRequestForList.mockImplementation((request) => ({
            vacationRequestId: request.vacations_request_id,
            status: request.status,
        }));
    });

    test("debe regresar VALIDATION_ERROR si actorEmployeeId no es UUID", async () => {
        const result = await getPendingVacationRequests({
            actorEmployeeId: "no-es-uuid",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.VACATION.VALIDATION_ERROR);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    test("debe regresar NOT_ACCESS si el actor no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue(null);

        const result = await getPendingVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el actor no es coordinador", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Administrador",
            },
        });

        const result = await getPendingVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
    });

    test("debe consultar solicitudes pendientes de la casa del coordinador", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        });

        getPendingVacationRequestsByHouse.mockResolvedValue({
            requests: [
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000001",
                    status: VACATION_STATUS.PENDING,
                },
            ],
            total: 1,
        });

        const result = await getPendingVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {
                page: "1",
                limit: "6",
                search: "Ana",
                startDate: "2026-10-01",
                endDate: "2026-10-31",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUESTS_FOUND);

        expect(parsePagination).toHaveBeenCalledWith("1", "6");

        expect(buildVacationListWhere).toHaveBeenCalledWith({
            houseId: "a0000001-0000-4000-8000-000000000001",
            search: "",
            startDate: "2026-10-01",
            endDate: "2026-10-31",
            statusFilter: VACATION_STATUS.PENDING,
        });

        expect(getPendingVacationRequestsByHouse).toHaveBeenCalledWith({
            where: {
                status: VACATION_STATUS.PENDING,
                employee: {
                    house_id: "a0000001-0000-4000-8000-000000000001",
                },
            },
            searchFilters: {
                houseId: "a0000001-0000-4000-8000-000000000001",
                search: "Ana",
                startDate: "2026-10-01",
                endDate: "2026-10-31",
                statusFilter: VACATION_STATUS.PENDING,
            },
            skip: 0,
            take: 6,
        });

        expect(result.data.requests).toEqual([
            {
                vacationRequestId: "c8000000-0000-4000-8000-000000000001",
                status: VACATION_STATUS.PENDING,
            },
        ]);

        expect(result.data.pagination.total).toBe(1);
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el coordinador no tiene privilegio manageEmployees vigente", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [],
            },
        });

        const result = await getPendingVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
        expect(getPendingVacationRequestsByHouse).not.toHaveBeenCalled();
    });
});

describe("US80 - getReviewedVacationRequests service", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        parsePagination.mockReturnValue({
            page: 1,
            limit: 6,
            skip: 0,
            take: 6,
        });

        buildPagination.mockReturnValue({
            page: 1,
            limit: 6,
            total: 2,
            totalPages: 1,
        });

        buildVacationListWhere.mockReturnValue({
            status: {
                in: [VACATION_STATUS.APPROVED, VACATION_STATUS.REJECTED],
            },
            employee: {
                house_id: "a0000001-0000-4000-8000-000000000001",
            },
        });

        mapVacationRequestForList.mockImplementation((request) => ({
            vacationRequestId: request.vacations_request_id,
            status: request.status,
        }));
    });

    test("debe regresar VALIDATION_ERROR si status es inválido", async () => {
        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {
                status: "pending",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.VALIDATION_ERROR);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    test("debe regresar NOT_ACCESS si el actor no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue(null);

        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el actor no es coordinador", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Administrador",
            },
        });

        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
    });

    test("debe consultar revisadas con status all", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        });

        mapReviewedStatus.mockReturnValue("all");

        getReviewedVacationRequestsByHouse.mockResolvedValue({
            requests: [
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000003",
                    status: VACATION_STATUS.APPROVED,
                },
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000004",
                    status: VACATION_STATUS.REJECTED,
                },
            ],
            total: 2,
        });

        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {
                status: "all",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUESTS_FOUND);

        expect(buildVacationListWhere).toHaveBeenCalledWith({
            houseId: "a0000001-0000-4000-8000-000000000001",
            search: "",
            startDate: undefined,
            endDate: undefined,
            statusFilter: {
                in: [VACATION_STATUS.APPROVED, VACATION_STATUS.REJECTED],
            },
        });

        expect(result.data.requests).toHaveLength(2);
    });

    test("debe consultar revisadas con status approved", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        });

        mapReviewedStatus.mockReturnValue(VACATION_STATUS.APPROVED);

        getReviewedVacationRequestsByHouse.mockResolvedValue({
            requests: [
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000003",
                    status: VACATION_STATUS.APPROVED,
                },
            ],
            total: 1,
        });

        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {
                status: "approved",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUESTS_FOUND);

        expect(buildVacationListWhere).toHaveBeenCalledWith({
            houseId: "a0000001-0000-4000-8000-000000000001",
            search: "",
            startDate: undefined,
            endDate: undefined,
            statusFilter: VACATION_STATUS.APPROVED,
        });
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el coordinador no tiene privilegio manageEmployees vigente", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [],
            },
        });

        const result = await getReviewedVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
        expect(getReviewedVacationRequestsByHouse).not.toHaveBeenCalled();
    });
});

describe("getFutureVacationRequests y getPastVacationRequests service", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-05-22T12:00:00.000Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        parsePagination.mockReturnValue({
            page: 1,
            limit: 6,
            skip: 0,
            take: 6,
        });

        buildPagination.mockReturnValue({
            page: 1,
            limit: 6,
            total: 1,
            totalPages: 1,
        });

        buildVacationDateFilter.mockReturnValue({});
        buildVacationEmployeeSearchFilter.mockReturnValue({});

        mapVacationRequestForList.mockImplementation((request) => ({
            vacationRequestId: request.vacations_request_id,
            status: request.status,
        }));
    });

    test("debe regresar VALIDATION_ERROR si status es inválido", async () => {
        const result = await getFutureVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000002",
            query: {
                status: "cancelled",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.VALIDATION_ERROR);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
    });

    test("debe regresar NOT_ACCESS si no recibe actorEmployeeId", async () => {
        const result = await getPastVacationRequests({
            actorEmployeeId: undefined,
            query: {},
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
        expect(getVacationRequestsByEmployee).not.toHaveBeenCalled();
    });

    test("debe consultar vacaciones futuras del empleado autenticado", async () => {
        buildVacationDateFilter.mockReturnValue({
            start: {
                lte: new Date("2026-06-30T00:00:00.000Z"),
            },
            end: {
                gte: new Date("2026-06-01T00:00:00.000Z"),
            },
        });

        getVacationRequestsByEmployee.mockResolvedValue({
            requests: [
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000005",
                    status: VACATION_STATUS.PENDING,
                },
            ],
            total: 1,
        });

        const result = await getFutureVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000002",
            query: {
                page: "1",
                limit: "6",
                status: "pending",
                startDate: "2026-06-01",
                endDate: "2026-06-30",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUESTS_FOUND);
        expect(buildVacationDateFilter).toHaveBeenCalledWith(
            new Date("2026-06-01T00:00:00.000Z"),
            new Date("2026-06-30T00:00:00.000Z"),
        );
        expect(getVacationRequestsByEmployee).toHaveBeenCalledWith({
            where: {
                employee_id: "e8000000-0000-4000-8000-000000000002",
                status: VACATION_STATUS.PENDING,
                start: {
                    lte: new Date("2026-06-30T00:00:00.000Z"),
                    gte: new Date("2026-05-22T00:00:00.000Z"),
                },
                end: {
                    gte: new Date("2026-06-01T00:00:00.000Z"),
                },
            },
            skip: 0,
            take: 6,
            orderBy: [
                { start: "asc" },
                { created_at: "desc" },
                { vacations_request_id: "asc" },
            ],
        });
        expect(result.data.requests).toEqual([
            {
                vacationRequestId: "c8000000-0000-4000-8000-000000000005",
                status: VACATION_STATUS.PENDING,
            },
        ]);
    });

    test("debe consultar vacaciones pasadas aprobadas del empleado autenticado", async () => {
        getVacationRequestsByEmployee.mockResolvedValue({
            requests: [
                {
                    vacations_request_id: "c8000000-0000-4000-8000-000000000006",
                    status: VACATION_STATUS.APPROVED,
                },
            ],
            total: 1,
        });

        const result = await getPastVacationRequests({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000002",
            query: {
                status: "approved",
            },
        });

        expect(result.code).toBe(RESPONSES.VACATION.REQUESTS_FOUND);
        expect(getVacationRequestsByEmployee).toHaveBeenCalledWith({
            where: {
                employee_id: "e8000000-0000-4000-8000-000000000002",
                status: VACATION_STATUS.APPROVED,
                start: {
                    lt: new Date("2026-05-22T00:00:00.000Z"),
                },
            },
            skip: 0,
            take: 6,
            orderBy: [
                { start: "desc" },
                { created_at: "desc" },
                { vacations_request_id: "asc" },
            ],
        });
        expect(result.data.pagination.total).toBe(1);
    });
});

describe("getEligibleVacationEmployees service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("debe regresar NOT_ACCESS si no recibe actorEmployeeId", async () => {
        const result = await getEligibleVacationEmployees({
            actorEmployeeId: undefined,
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
        expect(findByIdWithRoleAndHouse).not.toHaveBeenCalled();
        expect(getEligibleVacationEmployeesModel).not.toHaveBeenCalled();
    });

    test("debe regresar NOT_ACCESS si el actor no existe", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue(null);

        const result = await getEligibleVacationEmployees({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
        });

        expect(result.code).toBe(RESPONSES.USER.NOT_ACCESS);
        expect(findByIdWithRoleAndHouse).toHaveBeenCalledWith(
            "e8000000-0000-4000-8000-000000000001",
        );
        expect(getEligibleVacationEmployeesModel).not.toHaveBeenCalled();
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el actor no es admin ni coordinador", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Mantenimiento",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        });

        const result = await getEligibleVacationEmployees({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
        expect(getEligibleVacationEmployeesModel).not.toHaveBeenCalled();
    });

    test("debe regresar INSUFFICIENT_PERMISSIONS si el actor no tiene manageEmployees", async () => {
        findByIdWithRoleAndHouse.mockResolvedValue({
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [],
            },
        });

        const result = await getEligibleVacationEmployees({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
        });

        expect(result.code).toBe(RESPONSES.VACATION.INSUFFICIENT_PERMISSIONS);
        expect(getEligibleVacationEmployeesModel).not.toHaveBeenCalled();
    });

    test("debe regresar empleados elegibles mapeados para coordinador con permisos", async () => {
        const actorEmployee = {
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Coordinador",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        };

        findByIdWithRoleAndHouse.mockResolvedValue(actorEmployee);

        getEligibleVacationEmployeesModel.mockResolvedValue([
            {
                employee_id: "e8000000-0000-4000-8000-000000000002",
                name: "Empleado",
                surname: "Valido",
                curp: "CURP000000000001",
                is_active: true,
            },
        ]);

        const result = await getEligibleVacationEmployees({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
        });

        expect(getEligibleVacationEmployeesModel).toHaveBeenCalledWith({
            is_active: true,
            house_id: actorEmployee.house_id,
            role: {
                name: {
                    not: ROLES.ADMIN,
                },
            },
        });

        expect(result.data.employees).toEqual([
            {
                employeeId: "e8000000-0000-4000-8000-000000000002",
                name: "Empleado Valido",
                curp: "CURP000000000001",
                isActive: true,
            },
        ]);
    });

    test("debe regresar empleados elegibles mapeados para administrador con permisos", async () => {
        const actorEmployee = {
            employee_id: "e8000000-0000-4000-8000-000000000001",
            house_id: "a0000001-0000-4000-8000-000000000001",
            role: {
                name: "Administrador",
                role_privilege: [
                    {
                        privilege: {
                            name: "manageEmployees",
                        },
                    },
                ],
            },
        };

        findByIdWithRoleAndHouse.mockResolvedValue(actorEmployee);

        getEligibleVacationEmployeesModel.mockResolvedValue([
            {
                employee_id: "e8000000-0000-4000-8000-000000000003",
                name: "Coordinador",
                surname: "Prueba",
                curp: "CURP000000000002",
                is_active: true,
            },
        ]);

        const result = await getEligibleVacationEmployees({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
        });

        expect(result.code).toBe(RESPONSES.EMPLOYEE.FOUND);
        expect(getEligibleVacationEmployeesModel).toHaveBeenCalledWith({
            is_active: true,
        });

        expect(result.data.employees).toEqual([
            {
                employeeId: "e8000000-0000-4000-8000-000000000003",
                name: "Coordinador Prueba",
                curp: "CURP000000000002",
                isActive: true,
            },
        ]);
    });
});
