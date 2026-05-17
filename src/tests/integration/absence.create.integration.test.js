require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../../prisma");
const app = require("../../app");

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads/documents");
const PDF = Buffer.from("%PDF-1.4 absence create evidence");
const TXT = Buffer.from("not allowed");
const LARGE_PDF = Buffer.alloc(10 * 1024 * 1024 + 1, "a");

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    adminRole: randomUUID(),
    employeeRole: randomUUID(),
    addAbsencesPrivilege: randomUUID(),
    coordinatorA: randomUUID(),
    adminA: randomUUID(),
    employeeA: randomUUID(),
    inactiveEmployeeA: randomUUID(),
    employeeB: randomUUID(),
    roleDifferentEmployee: randomUUID(),
    absenceTypeA: randomUUID(),
    absenceTypeB: randomUUID(),
    vacationOverlap: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdAdminRole: false,
    createdPrivilege: false,
    createdCoordinatorAddPrivilege: false,
    createdAdminAddPrivilege: false,
};

const TEST_EMAILS = [
    "coordinador.absence.create@test.com",
    "admin.absence.create@test.com",
    "empleado.a.absence.create@test.com",
    "inactive.a.absence.create@test.com",
    "empleado.b.absence.create@test.com",
    "role.different.absence.create@test.com",
];

const dateOnly = (date) => date.toISOString().split("T")[0];

const todayUTC = () => {
    const today = new Date();

    return new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
        ),
    );
};

const dateFromTodayUTC = ({ years = 0, months = 0, days = 0 }) => {
    const today = todayUTC();

    return new Date(
        Date.UTC(
            today.getUTCFullYear() + years,
            today.getUTCMonth() + months,
            today.getUTCDate() + days,
        ),
    );
};

const validStartDate = (days = 5) =>
    dateOnly(dateFromTodayUTC({ months: 1, days }));
const validEndDate = (days = 6) =>
    dateOnly(dateFromTodayUTC({ months: 1, days }));

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.coordinatorA,
            email: "coordinador.absence.create@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: ["addAbsences"],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const validBody = (overrides = {}) => ({
    absenceTypeId: IDS.absenceTypeA,
    startDate: validStartDate(),
    endDate: validEndDate(),
    description: "Consulta medica programada",
    ...overrides,
});

const ensureUploadsDir = () => {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
};

const removeUploadedFilesForEmployees = async (employeeIds) => {
    if (employeeIds.length === 0) return;

    const absences = await prisma.absence.findMany({
        where: {
            employee_id: { in: employeeIds },
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

const cleanupCreatedAbsencesAndLogs = async () => {
    const employeeIds = [
        IDS.coordinatorA,
        IDS.adminA,
        IDS.employeeA,
        IDS.inactiveEmployeeA,
        IDS.employeeB,
        IDS.roleDifferentEmployee,
    ];

    await removeUploadedFilesForEmployees(employeeIds);

    await prisma.logs.deleteMany({
        where: {
            OR: [
                { employee_id: { in: employeeIds } },
                { affected: { in: employeeIds } },
            ],
        },
    });

    await prisma.absence.deleteMany({
        where: {
            employee_id: { in: employeeIds },
        },
    });
};

const cleanupTestData = async () => {
    const existingEmployees = await prisma.employee.findMany({
        where: {
            email: { in: TEST_EMAILS },
        },
        select: {
            employee_id: true,
        },
    });
    const existingEmployeeIds = existingEmployees.map(
        (employee) => employee.employee_id,
    );

    await removeUploadedFilesForEmployees(existingEmployeeIds);

    await prisma.logs.deleteMany({
        where: {
            OR: [
                { employee_id: { in: existingEmployeeIds } },
                { affected: { in: existingEmployeeIds } },
            ],
        },
    });

    await prisma.absence.deleteMany({
        where: {
            employee_id: { in: existingEmployeeIds },
        },
    });

    await prisma.vacations_request.deleteMany({
        where: {
            employee_id: { in: existingEmployeeIds },
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: { in: existingEmployeeIds },
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
            name: {
                startsWith: "Empleado ausencia create",
            },
        },
    });

    await prisma.house.deleteMany({
        where: {
            house_id: {
                in: [IDS.houseA, IDS.houseB],
            },
        },
    });
};

const ensureCatalog = async () => {
    await prisma.action.upsert({
        where: { action_id: "ausn-003" },
        update: {},
        create: {
            action_id: "ausn-003",
            description: "Creación de ausencia exitosa",
            important: false,
        },
    });

    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "addAbsences" },
    });
    if (existingPrivilege) {
        IDS.addAbsencesPrivilege = existingPrivilege.privilege_id;
    } else {
        STATE.createdPrivilege = true;
        await prisma.privileges.create({
            data: {
                privilege_id: IDS.addAbsencesPrivilege,
                name: "addAbsences",
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

    const coordinatorAddPrivilege = await prisma.role_privilege.findUnique({
        where: {
            role_id_privilege_id: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        },
    });
    if (!coordinatorAddPrivilege) {
        STATE.createdCoordinatorAddPrivilege = true;
        await prisma.role_privilege.create({
            data: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        });
    }

    const adminAddPrivilege = await prisma.role_privilege.findUnique({
        where: {
            role_id_privilege_id: {
                role_id: IDS.adminRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        },
    });
    if (!adminAddPrivilege) {
        STATE.createdAdminAddPrivilege = true;
        await prisma.role_privilege.create({
            data: {
                role_id: IDS.adminRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        });
    }
};

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa ausencia create A ${IDS.houseA}`,
                location: "Querétaro",
                phone_number: "4420000021",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa ausencia create B ${IDS.houseB}`,
                location: "Querétaro",
                phone_number: "4420000022",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    await prisma.role.create({
        data: {
            role_id: IDS.employeeRole,
            name: `Empleado ausencia create ${IDS.employeeRole.slice(0, 8)}`,
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
                email: "coordinador.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COAC900101HDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: IDS.adminA,
                house_id: IDS.houseA,
                role_id: IDS.adminRole,
                name: "Alicia",
                surname: "Admin",
                is_active: true,
                email: "admin.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ADAC900101HDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Luis",
                surname: "Martínez",
                is_active: true,
                email: "empleado.a.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "LUAC900101HDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: IDS.inactiveEmployeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Ines",
                surname: "Inactiva",
                is_active: false,
                email: "inactive.a.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "INAC900101HDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeB,
                house_id: IDS.houseB,
                role_id: IDS.employeeRole,
                name: "María",
                surname: "González",
                is_active: true,
                email: "empleado.b.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "MAAC900101MDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: IDS.roleDifferentEmployee,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Rosa",
                surname: "SinPermiso",
                is_active: true,
                email: "role.different.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ROAC900101MDFABC01",
                start_date: new Date("2024-01-01T00:00:00.000Z"),
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
};

beforeAll(async () => {
    ensureUploadsDir();
    await cleanupTestData();
    await ensureCatalog();
    await seed();
});

beforeEach(async () => {
    await cleanupCreatedAbsencesAndLogs();
    await prisma.vacations_request.deleteMany({
        where: {
            vacations_request_id: IDS.vacationOverlap,
        },
    });
});

afterEach(async () => {
    await cleanupCreatedAbsencesAndLogs();
    await prisma.vacations_request.deleteMany({
        where: {
            vacations_request_id: IDS.vacationOverlap,
        },
    });
});

afterAll(async () => {
    await cleanupTestData();

    if (STATE.createdCoordinatorAddPrivilege) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        });
    }

    if (STATE.createdAdminAddPrivilege) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.adminRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        });
    }

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
            where: { privilege_id: IDS.addAbsencesPrivilege },
        });
    }

    await prisma.$disconnect();
});

describe("POST /absence/:employeeId/add", () => {
    it("404 si el empleado no está en la base de datos", async () => {
        const res = await request(app)
            .post(`/absence/${randomUUID()}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody());

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Empleado no encontrado");
    });

    it("404 si el empleado está dado de baja", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.inactiveEmployeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody());

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("usuario no encontrado");
    });

    it("404 si el tipo de ausencia no existe", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ absenceTypeId: randomUUID() }));

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("tipo de ausencia no encontrado");
    });

    it("400 si faltan campos obligatorios", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({
                absenceTypeId: IDS.absenceTypeA,
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Campo obligatorio");
    });

    it("400 si la fecha de fin es mayor a un año", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    endDate: dateOnly(dateFromTodayUTC({ years: 1, days: 1 })),
                }),
            );

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Fecha de fin no puede ser mayor a un año");
    });

    it("400 si la fecha de inicio es menor a un mes", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    startDate: dateOnly(dateFromTodayUTC({ months: 1, days: -1 })),
                    endDate: dateOnly(dateFromTodayUTC({ months: 1 })),
                }),
            );

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Fecha de inicio no puede ser menor a un mes");
    });

    it("400 si la fecha de inicio es mayor a la fecha de fin", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    startDate: validEndDate(10),
                    endDate: validStartDate(8),
                }),
            );

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Fecha de inicio no puede mayor a la de fin");
    });

    it("400 si el formato de fecha no es YYYY-MM-DD", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate: "2026/06/20" }));

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Fecha solo puede tener un formato YYYY-MM-DD");
    });

    it("400 si la fecha no tiene 10 caracteres", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate: "2026-6-20" }));

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("El tamaño de la fecha debe ser de 10 caracteres");
    });

    it("400 si la descripción excede 200 caracteres", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ description: "a".repeat(201) }));

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Descripción no puede ser mayor a 200 caracteres");
    });

    it("400 si la descripción contiene emojis", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ description: "Reposo medico 😀" }));

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Descripción no permite caracteres especiales");
    });

    it("406 si hay empalme con vacaciones", async () => {
        await prisma.vacations_request.create({
            data: {
                vacations_request_id: IDS.vacationOverlap,
                employee_id: IDS.employeeA,
                start: new Date(`${validStartDate()}T00:00:00.000Z`),
                end: new Date(`${validEndDate()}T00:00:00.000Z`),
                status: 0,
                feedback: null,
                created_at: new Date(),
                used_days: 2,
            },
        });

        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody());

        expect(res.statusCode).toBe(406);
        expect(res.body.message).toBe("Ya hay una vacación registrada para esa fecha");
    });

    it("404 si el trabajador pertenece a otra casa hogar", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeB}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody());

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Acceso denegado");
    });

    it("406 si ya hay 10 ausencias registradas en la fecha", async () => {
        await prisma.absence.createMany({
            data: Array.from({ length: 10 }, () => ({
                absence_id: randomUUID(),
                employee_id: IDS.employeeA,
                absence_type_id: IDS.absenceTypeA,
                start: new Date(`${validStartDate()}T00:00:00.000Z`),
                end: new Date(`${validStartDate()}T00:00:00.000Z`),
                description: "Ausencia existente para limite",
                url: null,
                is_deleted: false,
            })),
        });

        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ endDate: validStartDate() }));

        expect(res.statusCode).toBe(406);
        expect(res.body.message).toBe(
            "Limite de 10 ausencias registradas en una misma fecha",
        );
    });

    it("400 si la evidencia tiene formato inválido", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .field("absenceTypeId", IDS.absenceTypeA)
            .field("startDate", validStartDate())
            .field("endDate", validEndDate())
            .field("description", "Consulta medica con evidencia")
            .attach("file", TXT, "malware.exe");

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Solo se permiten archivos PDF, JPEG, JPG y PNG");
    });

    it("400 si la evidencia supera 10mb", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .field("absenceTypeId", IDS.absenceTypeA)
            .field("startDate", validStartDate())
            .field("endDate", validEndDate())
            .field("description", "Consulta medica con evidencia")
            .attach("file", LARGE_PDF, "large.pdf");

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("El archivo excede el tamaño permitido (5MB)");
    });

    it("403 si el rol no puede agregar ausencias", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set(
                "Authorization",
                `Bearer ${sign({
                    id: IDS.roleDifferentEmployee,
                    email: "role.different.absence.create@test.com",
                    role: "Responsable del cuidado de NNA",
                    privileges: ["addAbsences"],
                })}`,
            )
            .send(validBody());

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Role not allowed");
    });

    it("403 si no tiene el permiso addAbsences", async () => {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.addAbsencesPrivilege,
            },
        });

        try {
            const res = await request(app)
                .post(`/absence/${IDS.employeeA}/add`)
                .set("Authorization", `Bearer ${sign()}`)
                .send(validBody());

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe("Insufficient privileges");
        } finally {
            await prisma.role_privilege.upsert({
                where: {
                    role_id_privilege_id: {
                        role_id: IDS.coordinatorRole,
                        privilege_id: IDS.addAbsencesPrivilege,
                    },
                },
                update: {},
                create: {
                    role_id: IDS.coordinatorRole,
                    privilege_id: IDS.addAbsencesPrivilege,
                },
            });
        }
    });

    it("201 registra ausencia sin evidencia y crea log", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ description: "Consulta medica sin evidencia" }));

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Ausencia creada con éxito");
        expect(res.body.data.absence).toMatchObject({
            employeeId: IDS.employeeA,
            absenceTypeId: IDS.absenceTypeA,
            description: "Consulta medica sin evidencia",
            link: "",
            isDeleted: false,
        });

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: res.body.data.absence.absenceId },
        });
        expect(absenceInDb).toMatchObject({
            employee_id: IDS.employeeA,
            absence_type_id: IDS.absenceTypeA,
            description: "Consulta medica sin evidencia",
            url: null,
            is_deleted: false,
        });

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: IDS.coordinatorA,
                action_id: "ausn-003",
                affected: IDS.employeeA,
            },
        });
        expect(log).toBeTruthy();
    });

    it("201 registra ausencia con evidencia y crea log", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .field("absenceTypeId", IDS.absenceTypeA)
            .field("startDate", validStartDate(8))
            .field("endDate", validEndDate(9))
            .field("description", "Consulta medica con evidencia")
            .attach("file", PDF, "evidence.pdf");

        expect(res.statusCode).toBe(201);
        expect(res.body.data.absence.link).toMatch(/^uploads\/documents\/.+\.pdf$/);

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: res.body.data.absence.absenceId },
        });

        expect(absenceInDb.url).toMatch(/^uploads\/documents\/.+\.pdf$/);
        expect(fs.existsSync(path.resolve(process.cwd(), absenceInDb.url))).toBe(true);

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: IDS.coordinatorA,
                action_id: "ausn-003",
                affected: IDS.employeeA,
            },
        });
        expect(log).toBeTruthy();
    });
});
