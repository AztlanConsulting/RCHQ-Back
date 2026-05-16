require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const prisma = require("../../prisma");
const { randomUUID } = require("crypto");
const app = require("../../app");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads/documents");
const PDF = Buffer.from("%PDF-1.4 absence evidence");
const TXT = Buffer.from("malicious content");
const ORIGINAL_ABSENCE_A = {
    absence_type_id: null,
    start: new Date("2026-05-05T00:00:00.000Z"),
    end: new Date("2026-05-09T00:00:00.000Z"),
    description: "Ausencia casa A",
    url: "https://example.com/a.pdf",
};
const ORIGINAL_ABSENCE_B = {
    absence_type_id: null,
    start: new Date("2026-05-12T00:00:00.000Z"),
    end: new Date("2026-05-14T00:00:00.000Z"),
    description: "Ausencia casa B",
    url: "https://example.com/b.pdf",
};

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    adminRole: randomUUID(),
    employeeRole: randomUUID(),
    editAbsencesPrivilege: randomUUID(),
    coordinatorA: randomUUID(),
    adminA: randomUUID(),
    employeeA: randomUUID(),
    employeeB: randomUUID(),
    absenceTypeA: randomUUID(),
    absenceTypeB: randomUUID(),
    absenceA: randomUUID(),
    absenceB: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdAdminRole: false,
    createdPrivilege: false,
};

ORIGINAL_ABSENCE_A.absence_type_id = IDS.absenceTypeA;
ORIGINAL_ABSENCE_B.absence_type_id = IDS.absenceTypeA;

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.coordinatorA,
            email: "coordinador.absence@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: ["editAbsences"],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const ensureUploadsDir = () => {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
};

const removeLocalAbsenceFiles = async () => {
    const absences = await prisma.absence.findMany({
        where: {
            absence_id: { in: [IDS.absenceA, IDS.absenceB] },
        },
        select: {
            url: true,
        },
    });

    for (const absence of absences) {
        if (!absence.url || !absence.url.startsWith("uploads/documents/")) continue;
        const fullPath = path.resolve(process.cwd(), absence.url);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
};

const resetAbsences = async () => {
    await removeLocalAbsenceFiles();

    await prisma.absence.update({
        where: { absence_id: IDS.absenceA },
        data: ORIGINAL_ABSENCE_A,
    });

    await prisma.absence.update({
        where: { absence_id: IDS.absenceB },
        data: ORIGINAL_ABSENCE_B,
    });
};

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa A ${IDS.houseA}`,
                location: "Querétaro",
                phone_number: "4420000001",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa B ${IDS.houseB}`,
                location: "Querétaro",
                phone_number: "4420000002",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "editAbsences" },
    });
    if (existingPrivilege) {
        IDS.editAbsencesPrivilege = existingPrivilege.privilege_id;
    } else {
        STATE.createdPrivilege = true;
        await prisma.privileges.create({
            data: {
                privilege_id: IDS.editAbsencesPrivilege,
                name: "editAbsences",
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
        where: { name: "Admin" },
    });
    if (existingAdminRole) {
        IDS.adminRole = existingAdminRole.role_id;
    } else {
        STATE.createdAdminRole = true;
        await prisma.role.create({
            data: {
                role_id: IDS.adminRole,
                name: "Admin",
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
                privilege_id: IDS.editAbsencesPrivilege,
            },
        },
        update: {},
        create: {
            role_id: IDS.coordinatorRole,
            privilege_id: IDS.editAbsencesPrivilege,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: IDS.adminRole,
                privilege_id: IDS.editAbsencesPrivilege,
            },
        },
        update: {},
        create: {
            role_id: IDS.adminRole,
            privilege_id: IDS.editAbsencesPrivilege,
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
                email: "coordinador.absence@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COOC900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.adminA,
                house_id: IDS.houseA,
                role_id: IDS.adminRole,
                name: "Alicia",
                surname: "Admin",
                is_active: true,
                email: "admin.absence@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ALIA900101MDFABC01",
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
                email: "empleado.a.absence@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "LUIM900101HDFABC01",
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
                email: "empleado.b.absence@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "MARG900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
        ],
    });

    await prisma.absence_type.createMany({
        data: [
            {
                absence_type_id: IDS.absenceTypeA,
                name: `Médica-${IDS.absenceTypeA.slice(0, 8)}`,
            },
            {
                absence_type_id: IDS.absenceTypeB,
                name: `Paternidad-${IDS.absenceTypeB.slice(0, 8)}`,
            },
        ],
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
        ],
    });
};

const cleanup = async () => {
    await prisma.absence.deleteMany({
        where: {
            absence_id: { in: [IDS.absenceA, IDS.absenceB] },
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
            privilege_id: IDS.editAbsencesPrivilege,
            role_id: {
                in: [IDS.coordinatorRole, IDS.adminRole],
            },
        },
    });

    await prisma.absence_type.deleteMany({
        where: {
            absence_type_id: {
                in: [IDS.absenceTypeA, IDS.absenceTypeB],
            },
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
            where: { privilege_id: IDS.editAbsencesPrivilege },
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
    ensureUploadsDir();
    await seed();
});

afterEach(async () => {
    await resetAbsences();
});

afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
});

describe("PUT /absence/:absenceId", () => {
    it("400 si el payload está vacío", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({});

        expect(res.statusCode).toBe(400);
    });

    it("404 si la ausencia no existe", async () => {
        const res = await request(app)
            .put(`/absence/${randomUUID()}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({ description: "Nueva descripción" });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Ausencia no encontrada");
    });

    it("403 si el coordinador intenta editar una ausencia de otra casa", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceB}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({ description: "No debería poder" });

        expect(res.statusCode).toBe(403);
    });

    it("406 si la fecha final es menor a la inicial", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({
                startDate: "2026-05-20",
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.message).toBe("La fecha de fin no puede ser menor a la fecha de inicio");
    });

    it("400 si el tipo de ausencia no existe", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({
                absenceTypeId: randomUUID(),
            });

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Tipo de ausencia inválida");
    });

    it("200 y actualiza la ausencia para un coordinador de la misma casa", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({
                absenceTypeId: IDS.absenceTypeB,
                description: "Descripción editada",
                startDate: "2026-05-06",
                endDate: "2026-05-10",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.absence).toMatchObject({
            absenceId: IDS.absenceA,
            employeeId: IDS.employeeA,
            absenceTypeId: IDS.absenceTypeB,
            name: "Luis Martínez",
            type: expect.stringContaining("Paternidad-"),
            description: "Descripción editada",
            isDeleted: false,
        });

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: IDS.absenceA },
        });

        expect(absenceInDb.absence_type_id).toBe(IDS.absenceTypeB);
        expect(absenceInDb.description).toBe("Descripción editada");
        expect(absenceInDb.start.toISOString()).toBe("2026-05-06T00:00:00.000Z");
        expect(absenceInDb.end.toISOString()).toBe("2026-05-10T00:00:00.000Z");
    });

    it("200 y un admin puede editar una ausencia de otra casa", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceB}`)
            .set("Authorization", `Bearer ${sign({
                id: IDS.adminA,
                email: "admin.absence@test.com",
                role: "Admin",
                privileges: ["editAbsences"],
            })}`)
            .send({
                description: "Editada por admin",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.absence).toMatchObject({
            absenceId: IDS.absenceB,
            employeeId: IDS.employeeB,
            description: "Editada por admin",
        });
    });

    it("200 y permite actualizar solo la evidencia con multipart", async () => {
        const oldFileRelativePath = "uploads/documents/absence-old-evidence.pdf";
        const oldFileAbsolutePath = path.resolve(process.cwd(), oldFileRelativePath);
        fs.writeFileSync(oldFileAbsolutePath, PDF);

        await prisma.absence.update({
            where: { absence_id: IDS.absenceA },
            data: { url: oldFileRelativePath },
        });

        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .attach("file", PDF, "absence-new-evidence.pdf");

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.absence.link).toMatch(/^uploads\/documents\/.+\.pdf$/);

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: IDS.absenceA },
        });

        expect(absenceInDb.url).toMatch(/^uploads\/documents\/.+\.pdf$/);
        expect(absenceInDb.url).not.toBe(oldFileRelativePath);
        expect(fs.existsSync(path.resolve(process.cwd(), absenceInDb.url))).toBe(true);
        expect(fs.existsSync(oldFileAbsolutePath)).toBe(false);
    });

    it("200 y permite actualizar evidencia y datos en la misma petición multipart", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .field("absenceTypeId", IDS.absenceTypeB)
            .field("description", "Ausencia con evidencia nueva")
            .field("startDate", "2026-05-07")
            .field("endDate", "2026-05-11")
            .attach("file", PDF, "absence-mixed-update.pdf");

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.absence).toMatchObject({
            absenceId: IDS.absenceA,
            employeeId: IDS.employeeA,
            absenceTypeId: IDS.absenceTypeB,
            description: "Ausencia con evidencia nueva",
        });
        expect(res.body.data.absence.link).toMatch(/^uploads\/documents\/.+\.pdf$/);

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: IDS.absenceA },
        });

        expect(absenceInDb.absence_type_id).toBe(IDS.absenceTypeB);
        expect(absenceInDb.description).toBe("Ausencia con evidencia nueva");
        expect(absenceInDb.start.toISOString()).toBe("2026-05-07T00:00:00.000Z");
        expect(absenceInDb.end.toISOString()).toBe("2026-05-11T00:00:00.000Z");
        expect(absenceInDb.url).toMatch(/^uploads\/documents\/.+\.pdf$/);
        expect(fs.existsSync(path.resolve(process.cwd(), absenceInDb.url))).toBe(true);
    });

    it("400 si intenta subir un archivo con tipo inválido", async () => {
        const res = await request(app)
            .put(`/absence/${IDS.absenceA}`)
            .set("Authorization", `Bearer ${sign()}`)
            .attach("file", TXT, "absence.exe");

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Solo se permiten archivos PDF, JPEG, JPG y PNG");

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: IDS.absenceA },
        });

        expect(absenceInDb.url).toBe(ORIGINAL_ABSENCE_A.url);
    });
});
