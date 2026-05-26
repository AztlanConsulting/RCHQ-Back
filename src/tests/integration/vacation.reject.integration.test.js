const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../../src/index");

const employeeGetModel = require("../../../src/model/employee/get.model");
const vacationGetModel = require("../../../src/model/vacation/get.model");
const vacationUpdateModel = require("../../../src/model/vacation/update.model");
const logModel = require("../../../src/model/log.model");

const { VACATION_STATUS } = require("../../../src/utils/vacationStatus");

jest.mock("../../../src/model/employee/get.model");
jest.mock("../../../src/model/vacation/get.model");
jest.mock("../../../src/model/vacation/update.model");
jest.mock("../../../src/model/log.model");

describe("US35 - PATCH /vacation/request/:vacationRequestId/reject", () => {
    const OLD_ENV = process.env;

    const actorEmployeeId = "e3500000-0000-4000-8000-000000000001";
    const employeeWithoutPermissionsId = "e3500000-0000-4000-8000-000000000002";
    const targetEmployeeId = "e3500000-0000-4000-8000-000000000013";
    const vacationRequestId = "c3500000-0000-4000-8000-000000000014";

    const houseId = "a0000001-0000-4000-8000-000000000001";

    const coordinatorTokenPayload = {
        id: actorEmployeeId,
        employeeId: actorEmployeeId,
        houseId,
        role: "Coordinador",
        privileges: ["manageEmployees"],
        tokenType: "SESSION",
    };

    const adminTokenPayload = {
        id: "b8f54b14-701e-4e87-a019-caef53dcda99",
        employeeId: "b8f54b14-701e-4e87-a019-caef53dcda99",
        houseId,
        role: "Administrador",
        privileges: ["manageEmployees"],
        tokenType: "SESSION",
    };

    const employeeTokenPayload = {
        id: employeeWithoutPermissionsId,
        employeeId: employeeWithoutPermissionsId,
        houseId,
        role: "Mantenimiento",
        privileges: [],
        tokenType: "SESSION",
    };

    const actorCoordinator = {
        employee_id: actorEmployeeId,
        house_id: houseId,
        role: {
            name: "Coordinador",
        },
    };

    const targetEmployee = {
        employee_id: targetEmployeeId,
        house_id: houseId,
        role: {
            name: "Mantenimiento",
        },
    };

    const pendingVacationRequest = {
        vacations_request_id: vacationRequestId,
        employee_id: targetEmployeeId,
        start: new Date("2026-12-01T00:00:00.000Z"),
        end: new Date("2026-12-03T00:00:00.000Z"),
        status: VACATION_STATUS.PENDING,
        feedback: null,
        created_at: new Date("2026-05-13T16:35:24.746Z"),
        used_days: 3,
    };

    const buildToken = (payload) => {
        return jwt.sign(payload, process.env.JWT_SECRET);
    };

    beforeAll(() => {
        process.env = {
            ...OLD_ENV,
            JWT_SECRET: "test-secret",
            NODE_ENV: "test",
        };
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function mockHappyPath({ feedback = null } = {}) {
        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(pendingVacationRequest);

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce({
            success: true,
            data: {
                vacationRequest: {
                    ...pendingVacationRequest,
                    status: VACATION_STATUS.REJECTED,
                    feedback,
                },
            },
        });

        logModel.createLog.mockResolvedValueOnce(undefined);
    }

    it("regresa 401 si no se manda token", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .send({});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Token no proporcionado");
    });

    it("regresa 401 si el token es inválido", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", "Bearer token_invalido")
            .send({});

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Token inválido o expirado");
    });

    it("regresa 403 si el rol no es Coordinador", async () => {
        const token = buildToken(employeeTokenPayload);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Role not allowed");
    });

    it("regresa 403 si el usuario es Administrador", async () => {
        const token = buildToken(adminTokenPayload);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Role not allowed");
    });

    it("regresa 400 si vacationRequestId no es UUID", async () => {
        const token = buildToken(coordinatorTokenPayload);

        const response = await request(app)
            .patch("/vacation/request/no-es-uuid/reject")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("VALIDATION_ERROR");
        expect(response.body.errors[0].path).toBe("params.vacationRequestId");
    });

    it("regresa 400 si feedback supera 500 caracteres", async () => {
        const token = buildToken(coordinatorTokenPayload);
        const longFeedback = "x".repeat(501);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback: longFeedback,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("VALIDATION_ERROR");
        expect(response.body.errors[0].path).toBe("body.feedback");
    });

    it("regresa 400 si body trae campos no permitidos", async () => {
        const token = buildToken(coordinatorTokenPayload);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback: "Texto válido",
                extra: "campo malicioso",
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("regresa 400 si feedback no es string", async () => {
        const token = buildToken(coordinatorTokenPayload);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback: 123,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("VALIDATION_ERROR");
        expect(response.body.errors[0].path).toBe("body.feedback");
    });

    it("regresa 400 si feedback contiene caracteres no permitidos", async () => {
        const token = buildToken(coordinatorTokenPayload);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback: "No procede <script>alert(1)</script> 🙂",
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("VALIDATION_ERROR");
        expect(response.body.errors[0].path).toBe("body.feedback");
    });

    it("regresa 404 si la solicitud no existe", async () => {
        const token = buildToken(coordinatorTokenPayload);

        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(actorCoordinator);
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(null);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Solicitud de vacaciones no encontrada");
    });

    it("regresa 406 si la solicitud ya fue aprobada", async () => {
        const token = buildToken(coordinatorTokenPayload);

        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(actorCoordinator);
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce({
            ...pendingVacationRequest,
            status: VACATION_STATUS.APPROVED,
        });

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("La solicitud ya fue revisada");
    });

    it("regresa 406 si la solicitud ya fue rechazada", async () => {
        const token = buildToken(coordinatorTokenPayload);

        employeeGetModel.findByIdWithRoleAndHouse.mockResolvedValueOnce(actorCoordinator);
        vacationGetModel.getVacationRequestById.mockResolvedValueOnce({
            ...pendingVacationRequest,
            status: VACATION_STATUS.REJECTED,
        });

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("La solicitud ya fue revisada");
    });

    it("regresa 403 si el empleado pertenece a otra casa", async () => {
        const token = buildToken(coordinatorTokenPayload);

        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce({
                ...targetEmployee,
                house_id: "b0000001-0000-4000-8000-000000000001",
            });

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(pendingVacationRequest);

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("No puede acceder a este recurso");
    });

    it("rechaza exitosamente sin feedback", async () => {
        const token = buildToken(coordinatorTokenPayload);

        mockHappyPath({
            feedback: null,
        });

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Solicitud rechazada correctamente");
        expect(response.body.data.vacationRequest.status).toBe(VACATION_STATUS.REJECTED);
        expect(response.body.data.vacationRequest.feedback).toBeNull();
    });

    it("rechaza exitosamente con feedback", async () => {
        const token = buildToken(coordinatorTokenPayload);
        const feedback =
            "Periodo crítico 24/12: alta demanda operativa; favor reprogramar 🙂👍🏽.";

        mockHappyPath({
            feedback,
        });

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback,
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Solicitud rechazada correctamente");
        expect(response.body.data.vacationRequest.status).toBe(VACATION_STATUS.REJECTED);
        expect(response.body.data.vacationRequest.feedback).toBe(feedback);
    });

    it("regresa 406 si la transacción detecta concurrencia y la solicitud ya fue revisada", async () => {
        const token = buildToken(coordinatorTokenPayload);

        employeeGetModel.findByIdWithRoleAndHouse
            .mockResolvedValueOnce(actorCoordinator)
            .mockResolvedValueOnce(targetEmployee);

        vacationGetModel.getVacationRequestById.mockResolvedValueOnce(pendingVacationRequest);

        vacationUpdateModel.rejectVacationRequestAtomically.mockResolvedValueOnce({
            success: false,
            code: "VACATION_REQUEST_ALREADY_REVIEWED",
        });

        const response = await request(app)
            .patch(`/vacation/request/${vacationRequestId}/reject`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                feedback: "Rechazo concurrente",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("La solicitud ya fue revisada");
    });
});
