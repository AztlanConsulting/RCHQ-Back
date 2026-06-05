const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient();

const TRAINING_EVENT_TYPE_ID = "b1000000-0000-4000-8000-000000000004";
let trainingEventTypeId = TRAINING_EVENT_TYPE_ID;
const API_BASE = "/event/trainings";
const JWT_SECRET = process.env.JWT_SECRET;

const IDS = {
    houseA: "d1100000-0000-4000-8000-000000000001",
    houseB: "d1100000-0000-4000-8000-000000000002",
    adminRole: "d1200000-0000-4000-8000-000000000001",
    coordinatorRole: "d1200000-0000-4000-8000-000000000002",
    workerRole: "d1200000-0000-4000-8000-000000000003",
    admin: "d1300000-0000-4000-8000-000000000001",
    coordinatorA: "d1300000-0000-4000-8000-000000000002",
    coordinatorB: "d1300000-0000-4000-8000-000000000003",
    workerA: "d1300000-0000-4000-8000-000000000004",
    workerB: "d1300000-0000-4000-8000-000000000005",
    workerOtherHouse: "d1300000-0000-4000-8000-000000000006",
    workerWithoutTrainings: "d1300000-0000-4000-8000-000000000007",
    trainingA: "d1400000-0000-4000-8000-000000000001",
    trainingB: "d1400000-0000-4000-8000-000000000002",
};

const ALL_EMPLOYEE_IDS = [
    IDS.admin,
    IDS.coordinatorA,
    IDS.coordinatorB,
    IDS.workerA,
    IDS.workerB,
    IDS.workerOtherHouse,
    IDS.workerWithoutTrainings,
];

const sign = ({
    id,
    role,
    houseId,
    privileges = ["viewEvents"],
    expiresIn = "1h",
} = {}) =>
    jwt.sign(
        {
            employeeId: id,
            id,
            role,
            houseId,
            tokenType: "SESSION",
            privileges,
        },
        JWT_SECRET,
        { expiresIn },
    );

const upsertRole = async (roleId, name) => {
    const existing = await prisma.role.findFirst({
        where: { name },
        select: { role_id: true },
    });

    if (existing) return existing.role_id;

    await prisma.role.create({
        data: {
            role_id: roleId,
            name,
        },
    });

    return roleId;
};

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Training House A ${IDS.houseA.slice(0, 8)}`,
                location: "Queretaro",
                phone_number: "4420000001",
                description: "Casa A para tests de capacitaciones",
                image: "house-a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Training House B ${IDS.houseB.slice(0, 8)}`,
                location: "Queretaro",
                phone_number: "4420000002",
                description: "Casa B para tests de capacitaciones",
                image: "house-b.jpg",
            },
        ],
    });

    const adminRoleId = await upsertRole(IDS.adminRole, "Administrador");
    const coordinatorRoleId = await upsertRole(
        IDS.coordinatorRole,
        "Coordinador",
    );
    const workerRoleId = await upsertRole(IDS.workerRole, "Mantenimiento");

    const existingTrainingType = await prisma.event_type.findFirst({
        where: { name: "Capacitaciones" },
        select: { event_type_id: true },
    });

    if (existingTrainingType) {
        trainingEventTypeId = existingTrainingType.event_type_id;
    } else {
        await prisma.event_type.create({
            data: {
                event_type_id: trainingEventTypeId,
                name: "Capacitaciones",
            },
        });
        trainingEventTypeId = TRAINING_EVENT_TYPE_ID;
    }

    await prisma.employee.createMany({
        data: [
            {
                employee_id: IDS.admin,
                house_id: IDS.houseA,
                role_id: adminRoleId,
                name: "Admin",
                surname: "Testing",
                email: `admin.trainings.${IDS.admin.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `ADMINTRN${IDS.admin.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.coordinatorA,
                house_id: IDS.houseA,
                role_id: coordinatorRoleId,
                name: "Coord",
                surname: "CasaA",
                email: `coord.a.${IDS.coordinatorA.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `COORDA${IDS.coordinatorA.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.coordinatorB,
                house_id: IDS.houseB,
                role_id: coordinatorRoleId,
                name: "Coord",
                surname: "CasaB",
                email: `coord.b.${IDS.coordinatorB.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `COORDB${IDS.coordinatorB.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.workerA,
                house_id: IDS.houseA,
                role_id: workerRoleId,
                name: "Ana",
                surname: "Lopez",
                email: `worker.a.${IDS.workerA.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `WORKA${IDS.workerA.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.workerB,
                house_id: IDS.houseA,
                role_id: workerRoleId,
                name: "Luis",
                surname: "Perez",
                email: `worker.b.${IDS.workerB.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `WORKB${IDS.workerB.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.workerOtherHouse,
                house_id: IDS.houseB,
                role_id: workerRoleId,
                name: "Mario",
                surname: "Ruiz",
                email: `worker.c.${IDS.workerOtherHouse.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `WORKC${IDS.workerOtherHouse.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: IDS.workerWithoutTrainings,
                house_id: IDS.houseA,
                role_id: workerRoleId,
                name: "Nora",
                surname: "Campos",
                email: `worker.empty.${IDS.workerWithoutTrainings.slice(0, 8)}@test.com`,
                password: "hashed",
                curp: `WORKD${IDS.workerWithoutTrainings.slice(0, 8)}`.slice(0, 18),
                start_date: new Date("2026-01-01T00:00:00.000Z"),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
        ],
    });

    await prisma.personal_event.createMany({
        data: [
            {
                personal_event_id: IDS.trainingA,
                event_type_id: trainingEventTypeId,
                date: new Date("2026-05-27T00:00:00.000Z"),
                start: new Date("2026-05-27T12:30:00.000Z"),
                end: new Date("2026-05-27T14:00:00.000Z"),
                name: "Capacitacion del DIF",
                description: "Sesion interna",
                all_day: false,
                is_deleted: false,
                trainer: "Emilio Santiago Lopez Quinonez",
            },
            {
                personal_event_id: IDS.trainingB,
                event_type_id: trainingEventTypeId,
                date: new Date("2026-05-28T00:00:00.000Z"),
                start: new Date("2026-05-28T10:00:00.000Z"),
                end: new Date("2026-05-28T12:00:00.000Z"),
                name: "Capacitacion fuera del empleado",
                description: "Sesion casa B",
                all_day: false,
                is_deleted: false,
                trainer: "Otra Persona",
            },
        ],
    });

    await prisma.employee_personal_event.createMany({
        data: [
            {
                personal_event_id: IDS.trainingA,
                employee_id: IDS.workerA,
            },
            {
                personal_event_id: IDS.trainingA,
                employee_id: IDS.workerB,
            },
            {
                personal_event_id: IDS.trainingA,
                employee_id: IDS.coordinatorA,
            },
            {
                personal_event_id: IDS.trainingB,
                employee_id: IDS.workerOtherHouse,
            },
            {
                personal_event_id: IDS.trainingB,
                employee_id: IDS.coordinatorB,
            },
        ],
    });
};

const clean = async () => {
    await prisma.employee_personal_event.deleteMany({
        where: {
            OR: [
                { personal_event_id: { in: [IDS.trainingA, IDS.trainingB] } },
                { employee_id: { in: ALL_EMPLOYEE_IDS } },
            ],
        },
    });

    await prisma.personal_event.deleteMany({
        where: {
            personal_event_id: { in: [IDS.trainingA, IDS.trainingB] },
        },
    });

    await prisma.logs.deleteMany({
        where: {
            employee_id: { in: ALL_EMPLOYEE_IDS },
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: { in: ALL_EMPLOYEE_IDS },
        },
    });

    await prisma.house.deleteMany({
        where: {
            house_id: { in: [IDS.houseA, IDS.houseB] },
        },
    });
};

beforeAll(async () => {
    await clean();
    await seed();
});

afterAll(async () => {
    await clean();
    await prisma.$disconnect();
});

describe("GET /event/trainings/:employeeId", () => {
    it("401 — rechaza la solicitud sin token", async () => {
        const res = await request(app).get(`${API_BASE}/${IDS.workerA}`);

        expect(res.statusCode).toBe(401);
    });

    it("403 — rechaza cuando el token no tiene el privilegio viewEvents", async () => {
        const token = sign({
            id: IDS.coordinatorA,
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: [],
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("200 — trabajador puede consultar solo sus propias capacitaciones", async () => {
        const token = sign({
            id: IDS.workerA,
            role: "Mantenimiento",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.trainings).toHaveLength(1);
        expect(res.body.data.trainings[0]).toMatchObject({
            eventId: IDS.trainingA,
            name: "Capacitacion del DIF",
            type: "Capacitaciones",
            trainer: "Emilio Santiago Lopez Quinonez",
            peopleInsideEvent: expect.arrayContaining([
                { id: IDS.workerA, name: "Ana Lopez" },
                { id: IDS.workerB, name: "Luis Perez" },
                { id: IDS.coordinatorA, name: "Coord CasaA" },
            ]),
        });
    });

    it("403 — trabajador no puede consultar capacitaciones de otro empleado", async () => {
        const token = sign({
            id: IDS.workerB,
            role: "Mantenimiento",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("200 — coordinador puede consultar capacitaciones de empleados de su casa", async () => {
        const token = sign({
            id: IDS.coordinatorA,
            role: "Coordinador",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.trainings).toHaveLength(1);
        expect(res.body.data.trainings[0].peopleInsideEvent).toEqual(
            expect.arrayContaining([
                { id: IDS.workerA, name: "Ana Lopez" },
                { id: IDS.workerB, name: "Luis Perez" },
                { id: IDS.coordinatorA, name: "Coord CasaA" },
            ]),
        );
    });

    it("403 — coordinador no puede consultar capacitaciones de empleados de otra casa", async () => {
        const token = sign({
            id: IDS.coordinatorB,
            role: "Coordinador",
            houseId: IDS.houseB,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("200 — administrador puede consultar capacitaciones de cualquier empleado", async () => {
        const token = sign({
            id: IDS.admin,
            role: "Administrador",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerA}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.trainings[0]).toMatchObject({
            eventId: IDS.trainingA,
            trainer: "Emilio Santiago Lopez Quinonez",
        });
    });

    it("200 — responde trainings vacio cuando el empleado no tiene capacitaciones", async () => {
        const token = sign({
            id: IDS.coordinatorA,
            role: "Coordinador",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${IDS.workerWithoutTrainings}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            success: true,
            data: {
                trainings: [],
            },
        });
    });

    it("404 — responde not found cuando el employeeId no existe", async () => {
        const token = sign({
            id: IDS.admin,
            role: "Administrador",
            houseId: IDS.houseA,
        });

        const res = await request(app)
            .get(`${API_BASE}/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });
});
