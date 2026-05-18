const request = require("supertest");
const app = require("../../../src/index");

jest.mock("../../../src/middleware/auth", () => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Token no proporcionado",
            });
        }

        if (authHeader === "Bearer invalid-token") {
            return res.status(401).json({
                success: false,
                message: "Token inválido o expirado",
            });
        }

        if (authHeader === "Bearer coord-token") {
            req.user = {
                id: "e8000000-0000-4000-8000-000000000001",
                role: "Coordinador",
                houseId: "a0000001-0000-4000-8000-000000000001",
                privileges: ["manageEmployees"],
                tokenType: "SESSION",
            };
            return next();
        }

        if (authHeader === "Bearer admin-token") {
            req.user = {
                id: "b8f54b14-701e-4e87-a019-caef53dcda99",
                role: "Administrador",
                houseId: "a0000001-0000-4000-8000-000000000001",
                privileges: ["manageEmployees"],
                tokenType: "SESSION",
            };
            return next();
        }

        if (authHeader === "Bearer employee-token") {
            req.user = {
                id: "e8000000-0000-4000-8000-000000000002",
                role: "Mantenimiento",
                houseId: "a0000001-0000-4000-8000-000000000001",
                privileges: [],
                tokenType: "SESSION",
            };
            return next();
        }

        return res.status(401).json({
            success: false,
            message: "Token inválido o expirado",
        });
    };
});

jest.mock("../../../src/service/vacation/get.service", () => ({
    getRemainingVacations: jest.fn(),
    getPendingVacationRequests: jest.fn(),
    getReviewedVacationRequests: jest.fn(),
}));

const vacationGetService = require("../../../src/service/vacation/get.service");
const RESPONSES = require("../../../src/utils/responses");

describe("US80 - GET /vacation/requests/pending", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("debe rechazar si no hay token", async () => {
        const response = await request(app).get("/vacation/requests/pending");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("debe rechazar token inválido", async () => {
        const response = await request(app)
            .get("/vacation/requests/pending")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("debe rechazar empleado sin rol permitido", async () => {
        const response = await request(app)
            .get("/vacation/requests/pending")
            .set("Authorization", "Bearer employee-token");

        expect(response.status).toBe(403);
    });

    test("debe rechazar admin porque US80 es sólo coordinador", async () => {
        const response = await request(app)
            .get("/vacation/requests/pending")
            .set("Authorization", "Bearer admin-token");

        expect(response.status).toBe(403);
    });

    test("debe devolver solicitudes pendientes correctamente", async () => {
        vacationGetService.getPendingVacationRequests.mockResolvedValue({
            code: RESPONSES.VACATION.REQUESTS_FOUND,
            data: {
                requests: [
                    {
                        vacationRequestId:
                            "c8000000-0000-4000-8000-000000000001",
                        status: 0,
                        statusLabel: "Pendiente",
                        usedDays: 3,
                        employee: {
                            employeeId: "e8000000-0000-4000-8000-000000000003",
                            fullName: "Ana Pendiente US80",
                        },
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 6,
                    total: 1,
                    totalPages: 1,
                },
            },
        });

        const response = await request(app)
            .get("/vacation/requests/pending")
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);
        expect(
            vacationGetService.getPendingVacationRequests,
        ).toHaveBeenCalledWith({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {},
        });
    });

    test("debe validar fecha inválida en pendientes", async () => {
        const response = await request(app)
            .get("/vacation/requests/pending?startDate=2026-99-99")
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    test("debe validar query param no permitido en pendientes", async () => {
        const response = await request(app)
            .get("/vacation/requests/pending?hack=true")
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });
});

describe("US80 - GET /vacation/requests/reviewed", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("debe rechazar si no hay token", async () => {
        const response = await request(app).get("/vacation/requests/reviewed");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    test("debe rechazar empleado sin rol permitido", async () => {
        const response = await request(app)
            .get("/vacation/requests/reviewed")
            .set("Authorization", "Bearer employee-token");

        expect(response.status).toBe(403);
    });

    test("debe devolver solicitudes revisadas correctamente", async () => {
        vacationGetService.getReviewedVacationRequests.mockResolvedValue({
            code: RESPONSES.VACATION.REQUESTS_FOUND,
            data: {
                requests: [
                    {
                        vacationRequestId:
                            "c8000000-0000-4000-8000-000000000003",
                        status: 1,
                        statusLabel: "Aprobada",
                        usedDays: 3,
                        employee: {
                            employeeId: "e8000000-0000-4000-8000-000000000004",
                            fullName: "Luis Revisado US80",
                        },
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 6,
                    total: 1,
                    totalPages: 1,
                },
            },
        });

        const response = await request(app)
            .get("/vacation/requests/reviewed?status=approved")
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(
            vacationGetService.getReviewedVacationRequests,
        ).toHaveBeenCalledWith({
            actorEmployeeId: "e8000000-0000-4000-8000-000000000001",
            query: {
                status: "approved",
            },
        });
    });

    test("debe validar status inválido en revisadas", async () => {
        const response = await request(app)
            .get("/vacation/requests/reviewed?status=pending")
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    test("debe validar rango de fechas inválido en revisadas", async () => {
        const response = await request(app)
            .get(
                "/vacation/requests/reviewed?startDate=2026-12-31&endDate=2026-01-01",
            )
            .set("Authorization", "Bearer coord-token");

        expect(response.status).toBe(400);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });
});
