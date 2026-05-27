require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
    },
});

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    adminRole: randomUUID(),
    employeeRole: randomUUID(),
    deleteAbsencesPrivilege: randomUUID(),
    coordinatorA: randomUUID(),
    adminA: randomUUID(),
    employeeA: randomUUID(),
    employeeB: randomUUID(),
    absenceTypeA: randomUUID(),
    absenceA: randomUUID(),
    absenceB: randomUUID(),
    absenceDeleted: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdAdminRole: false,
    createdPrivilege: false,
    createdAction: false,
};

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.coordinatorA,
            email: "coordinador.absence.delete@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: ["deleteAbsences"],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa A ${IDS.houseA}`,
                location: "Querétaro",
                phone_number: "4420000011",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa B ${IDS.houseB}`,
                location: "Querétaro",
                phone_number: "4420000012",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "deleteAbsences" },
    });
    if (existingPrivilege) {
        IDS.deleteAbsencesPrivilege = existingPrivilege.privilege_id;
    } else {
        STATE.createdPrivilege = true;
        await prisma.privileges.create({
            data: {
                privilege_id: IDS.deleteAbsencesPrivilege,
                name: "deleteAbsences",
            },
        });
    }

    const existingAction = await prisma.action.findUnique({
        where: { action_id: "ausn-002" },
    });
    if (!existingAction) {
        STATE.createdAction = true;
        await prisma.action.create({
            data: {
                action_id: "ausn-002",
                description: "Eliminación de ausencia exitosa",
                important: false,
            },
        });
    }

    const existingCoordinatorRole = await prisma.role.findUnique({
        where: { name: "Coordinador" },
    });
    if (existingCoordinatorRole) {
        IDS.coordinatorRole = existingCoordinatorRole.role_id;
    } else {
        STATE.createdCoordinatorRole = true;
        await prisma.role.create({
            data: {
                role_id: IDS.coordinatorRole,
                name: "Coordinador",
            },
        });
    }

    const existingAdminRole = await prisma.role.findUnique({
        where: { name: "Administrador" },
    });
    if (existingAdminRole) {
        IDS.adminRole = existingAdminRole.role_id;
    } else {
        STATE.createdAdminRole = true;
        await prisma.role.create({
            data: {
                role_id: IDS.adminRole,
                name: "Administrador",
            },
        });
    }

    await prisma.role.create({
        data: {
            role_id: IDS.employeeRole,
            name: `Empleado-${IDS.employeeRole.slice(0, 8)}`,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.deleteAbsencesPrivilege,
            },
        },
        update: {},
        create: {
            role_id: IDS.coordinatorRole,
            privilege_id: IDS.deleteAbsencesPrivilege,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: IDS.adminRole,
                privilege_id: IDS.deleteAbsencesPrivilege,
            },
        },
        update: {},
        create: {
            role_id: IDS.adminRole,
            privilege_id: IDS.deleteAbsencesPrivilege,
        },
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: IDS.coordinatorA,
                house_id: IDS.houseA,
                role_id: IDS.coordinatorRole,
                name: "Carmen",
                surname: "Coordinadora",
                is_active: true,
                email: "coordinador.absence.delete@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COOC900101MDFABC02",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.adminA,
                house_id: IDS.houseA,
                role_id: IDS.adminRole,
                name: "Alicia",
                surname: "Administrador",
                is_active: true,
                email: "admin.absence.delete@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ALIA900101MDFABC02",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Luis",
                surname: "Martínez",
                is_active: true,
                email: "empleado.a.absence.delete@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "LUIM900101HDFABC02",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeB,
                house_id: IDS.houseB,
                role_id: IDS.employeeRole,
                name: "María",
                surname: "González",
                is_active: true,
                email: "empleado.b.absence.delete@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "MARG900101MDFABC02",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
        ],
    });

    await prisma.absence_type.create({
        data: {
            absence_type_id: IDS.absenceTypeA,
            name: `Médica-${IDS.absenceTypeA.slice(0, 8)}`,
        },
    });

    await prisma.absence.createMany({
        data: [
            {
                absence_id: IDS.absenceA,
                employee_id: IDS.employeeA,
                absence_type_id: IDS.absenceTypeA,
                start: new Date("2026-05-05T00:00:00.000Z"),
                end: new Date("2026-05-09T00:00:00.000Z"),
                description: "Ausencia casa A",
                url: "https://example.com/a.pdf",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceB,
                employee_id: IDS.employeeB,
                absence_type_id: IDS.absenceTypeA,
                start: new Date("2026-05-12T00:00:00.000Z"),
                end: new Date("2026-05-14T00:00:00.000Z"),
                description: "Ausencia casa B",
                url: "https://example.com/b.pdf",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceDeleted,
                employee_id: IDS.employeeA,
                absence_type_id: IDS.absenceTypeA,
                start: new Date("2026-05-20T00:00:00.000Z"),
                end: new Date("2026-05-22T00:00:00.000Z"),
                description: "Ausencia ya borrada",
                url: "https://example.com/c.pdf",
                is_deleted: true,
            },
        ],
    });
};

const resetAbsences = async () => {
    await prisma.absence.updateMany({
        where: {
            absence_id: {
                in: [IDS.absenceA, IDS.absenceB],
            },
        },
        data: {
            is_deleted: false,
        },
    });

    await prisma.absence.update({
        where: { absence_id: IDS.absenceDeleted },
        data: {
            is_deleted: true,
        },
    });
};

const cleanup = async () => {
    await prisma.absence.deleteMany({
        where: {
            absence_id: { in: [IDS.absenceA, IDS.absenceB, IDS.absenceDeleted] },
        },
    });

    await prisma.absence.deleteMany({
        where: {
            employee_id: {
                in: [IDS.coordinatorA, IDS.adminA, IDS.employeeA, IDS.employeeB],
            },
        },
    });

    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [IDS.coordinatorA, IDS.adminA, IDS.employeeA, IDS.employeeB],
            },
        },
    });    

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [IDS.coordinatorA, IDS.adminA, IDS.employeeA, IDS.employeeB],
            },
        },
    });

    await prisma.role_privilege.deleteMany({
        where: {
            privilege_id: IDS.deleteAbsencesPrivilege,
            role_id: {
                in: [IDS.coordinatorRole, IDS.adminRole],
            },
        },
    });

    await prisma.absence_type.deleteMany({
        where: {
            absence_type_id: IDS.absenceTypeA,
        },
    });

    await prisma.role.deleteMany({
        where: {
            role_id: IDS.employeeRole,
        },
    });

    if (STATE.createdCoordinatorRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.coordinatorRole },
        });
    }

    if (STATE.createdAdminRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.adminRole },
        });
    }

    if (STATE.createdPrivilege) {
        await prisma.privileges.deleteMany({
            where: { privilege_id: IDS.deleteAbsencesPrivilege },
        });
    }

    if (STATE.createdAction) {
        await prisma.action.deleteMany({
            where: { action_id: "ausn-002" },
        });
    }

    await prisma.house.deleteMany({
        where: {
            house_id: {
                in: [IDS.houseA, IDS.houseB],
            },
        },
    });
};

beforeAll(async () => {
    await seed();
});

beforeEach(async () => {
    await resetAbsences();
});

afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
});

describe("DELETE /absence/:absenceId", () => {
    it("401 si no se envía token", async () => {
        const res = await request(app).delete(`/absence/${IDS.absenceA}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Token no proporcionado");
    });

    it("401 si el token es inválido", async () => {
        const res = await request(app)
            .delete(`/absence/${IDS.absenceA}`)
            .set("Authorization", "Bearer token-invalido");

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Token inválido o expirado");
    });

    it("403 si el token no es de sesión", async () => {
        const res = await request(app)
            .delete(`/absence/${IDS.absenceA}`)
            .set(
                "Authorization",
                `Bearer ${sign({ tokenType: "RESET_PASSWORD" })}`,
            );

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Token de sesión inválido");
    });

    it("400 si el absenceId no es UUID válido", async () => {
        const res = await request(app)
            .delete("/absence/no-es-uuid")
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Error de validación");
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: "params.absenceId",
                    message: "ID inválido",
                }),
            ]),
        );
    });

    it("403 si el usuario no tiene el privilegio deleteAbsences", async () => {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.deleteAbsencesPrivilege,
            },
        });

        try {
            const res = await request(app)
                .delete(`/absence/${IDS.absenceA}`)
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe("Permisos insuficientes");
        } finally {
            await prisma.role_privilege.upsert({
                where: {
                    role_id_privilege_id: {
                        role_id: IDS.coordinatorRole,
                        privilege_id: IDS.deleteAbsencesPrivilege,
                    },
                },
                update: {},
                create: {
                    role_id: IDS.coordinatorRole,
                    privilege_id: IDS.deleteAbsencesPrivilege,
                },
            });
        }
    });

    it("404 si la ausencia no existe", async () => {
        const res = await request(app)
            .delete(`/absence/${randomUUID()}`)
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Ausencia no encontrada");
    });

    it("404 si la ausencia ya fue eliminada", async () => {
        const res = await request(app)
            .delete(`/absence/${IDS.absenceDeleted}`)
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Ausencia no encontrada");
    });

    it("403 si el coordinador intenta borrar una ausencia de otra casa", async () => {
        const res = await request(app)
            .delete(`/absence/${IDS.absenceB}`)
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("No puede acceder a este recurso");
    });

    it("200 y hace soft delete para un coordinador de la misma casa", async () => {
        const res = await request(app)
            .delete(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Ausencia eliminada correctamente");
        expect(res.body.data.absence).toMatchObject({
            absenceId: IDS.absenceA,
            employeeId: IDS.employeeA,
            isDeleted: true,
        });

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: IDS.absenceA },
        });

        expect(absenceInDb.is_deleted).toBe(true);

        const deleteLog = await prisma.logs.findFirst({
            where: {
                employee_id: IDS.coordinatorA,
                action_id: "ausn-002",
                affected: IDS.employeeA,
            },
        });

        expect(deleteLog).toBeTruthy();
    });

    it("200 y un admin puede borrar una ausencia de otra casa", async () => {
        const freshAbsenceId = randomUUID();

        await prisma.absence.create({
            data: {
                absence_id: freshAbsenceId,
                employee_id: IDS.employeeB,
                absence_type_id: IDS.absenceTypeA,
                start: new Date("2026-06-01T00:00:00.000Z"),
                end: new Date("2026-06-03T00:00:00.000Z"),
                description: "Ausencia para borrar por admin",
                url: "https://example.com/admin.pdf",
                is_deleted: false,
            },
        });

        const res = await request(app)
            .delete(`/absence/${freshAbsenceId}`)
            .set(
                "Authorization",
                `Bearer ${sign({
                    id: IDS.adminA,
                    email: "admin.absence.delete@test.com",
                    role: "Administrador",
                    privileges: ["deleteAbsences"],
                })}`,
            );

        expect(res.statusCode).toBe(200);
        expect(res.body.data.absence).toMatchObject({
            absenceId: freshAbsenceId,
            employeeId: IDS.employeeB,
            isDeleted: true,
        });

        const deleteLog = await prisma.logs.findFirst({
            where: {
                employee_id: IDS.adminA,
                action_id: "ausn-002",
                affected: IDS.employeeB,
            },
        });

        expect(deleteLog).toBeTruthy();

        await prisma.absence.deleteMany({
            where: { absence_id: freshAbsenceId },
        });
    });
});
