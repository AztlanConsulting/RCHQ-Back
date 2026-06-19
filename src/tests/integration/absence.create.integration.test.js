require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const prisma = require("../../prisma");
const app = require("../../app");
const RESPONSES = require("../../utils/responses");

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
    noWorkdaysEmployeeA: randomUUID(),
    employeeB: randomUUID(),
    roleDifferentEmployee: randomUUID(),
    absenceTypeA: randomUUID(),
    absenceTypeB: randomUUID(),
    absenceTypeOtro: randomUUID(),
    vacationOverlap: randomUUID(),
    workdayLunes: randomUUID(),
    workdayMartes: randomUUID(),
    workdayMiercoles: randomUUID(),
    workdayJueves: randomUUID(),
    workdayViernes: randomUUID(),
    globalFreeEventType: randomUUID(),
    houseFreeEventType: randomUUID(),
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
    "no.workdays.absence.create@test.com",
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

const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);

    return nextDate;
};

const nextWeekdayDate = (fromDate, targetDay) => {
    const date = new Date(fromDate);

    while (date.getUTCDay() !== targetDay) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    return date;
};

const BASE_VALID_MONDAY = nextWeekdayDate(
    dateFromTodayUTC({ months: 1, days: 14 }),
    1,
);

const futureWorkWeekRange = (weeks = 0) => {
    const monday = addDays(BASE_VALID_MONDAY, weeks * 7);
    const friday = addDays(monday, 4);

    return {
        startDate: dateOnly(monday),
        endDate: dateOnly(friday),
    };
};

const validStartDate = (weeks = 0) => futureWorkWeekRange(weeks).startDate;
const validEndDate = (weeks = 0) => futureWorkWeekRange(weeks).endDate;

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

const localDateRangeToUtcEventRange = (startDate, endDate) => {
    const endDateUtc = new Date(`${endDate}T00:00:00.000Z`);
    endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 1);

    return {
        start: new Date(`${startDate}T06:00:00.000Z`),
        end: new Date(`${dateOnly(endDateUtc)}T05:59:00.000Z`),
    };
};

const seedEmployeeWorkdays = async (employeeIds) => {
    const workdays = [
        { name: "Lunes", id: IDS.workdayLunes },
        { name: "Martes", id: IDS.workdayMartes },
        { name: "Miércoles", id: IDS.workdayMiercoles },
        { name: "Jueves", id: IDS.workdayJueves },
        { name: "Viernes", id: IDS.workdayViernes },
    ];

    const savedWorkdays = [];

    for (const workday of workdays) {
        const savedWorkday = await prisma.workday.upsert({
            where: { name: workday.name },
            update: {},
            create: {
                workday_id: workday.id,
                name: workday.name,
            },
        });

        savedWorkdays.push(savedWorkday);
    }

    await prisma.employee_workday.createMany({
        data: employeeIds.flatMap((employeeId) =>
            savedWorkdays.map((workday) => ({
                employee_id: employeeId,
                workday_id: workday.workday_id,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
        ),
        skipDuplicates: true,
    });
};

const createEventType = async (eventTypeId, name) => {
    await prisma.event_type.upsert({
        where: { name },
        update: {},
        create: {
            event_type_id: eventTypeId,
            name,
        },
    });
};

const cleanupCreatedAbsencesAndLogs = async () => {
    const employeeIds = [
        IDS.coordinatorA,
        IDS.adminA,
        IDS.employeeA,
        IDS.inactiveEmployeeA,
        IDS.noWorkdaysEmployeeA,
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

    await prisma.global_event.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
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

    await prisma.global_event.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: {
                in: [IDS.globalFreeEventType, IDS.houseFreeEventType],
            },
        },
    });

    await prisma.employee_workday.deleteMany({
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
                in: [IDS.absenceTypeA, IDS.absenceTypeB, IDS.absenceTypeOtro],
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
                surname: "Administrador",
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
                employee_id: IDS.noWorkdaysEmployeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Nora",
                surname: "SinDias",
                is_active: true,
                email: "no.workdays.absence.create@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "NOAC900101MDFABC01",
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
            {
                absence_type_id: IDS.absenceTypeOtro,
                name: "Otro",
            },
        ],
    });

    await seedEmployeeWorkdays([
        IDS.coordinatorA,
        IDS.adminA,
        IDS.employeeA,
        IDS.employeeB,
        IDS.roleDifferentEmployee,
    ]);
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
        expect(res.body.message).toBe("Usuario no encontrado");
    });

    it("404 si el tipo de ausencia no existe", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ absenceTypeId: randomUUID() }));

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("Tipo de ausencia no encontrado");
    });

    it("406 si el empleado no tiene días de trabajo registrados", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.noWorkdaysEmployeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody());

        expect(RESPONSES.ABSENCE.WITHOUT_DATES).toBe("ABSENCE_WITHOUT_DATES");
        expect(res.statusCode).toBe(406);
        expect(res.body).toMatchObject({
            success: false,
            message: "Se necesitan tener registrados los días de trabajo",
        });
    });

    it("422 si faltan campos obligatorios", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send({
                absenceTypeId: IDS.absenceTypeA,
            });

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Campo obligatorio");
    });

    it("422 si la fecha de fin es mayor a un año", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    endDate: dateOnly(dateFromTodayUTC({ years: 1, days: 1 })),
                }),
            );

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Fecha de fin no puede ser mayor a un año");
    });

    it("422 si la fecha de inicio es menor a un mes antes del dia actual", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    startDate: dateOnly(dateFromTodayUTC({ months: - 1, days: - 1 })),
                    endDate: dateOnly(dateFromTodayUTC({ months: - 1 })),
                }),
            );

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe(
            "Fecha de inicio no puede ser menor a un mes",
        );
    });

    it("422 si la fecha de inicio es mayor a la fecha de fin", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    startDate: validEndDate(10),
                    endDate: validStartDate(8),
                }),
            );

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Fecha de inicio no puede mayor a la de fin");
    });

    it("422 si el formato de fecha no es YYYY-MM-DD", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate: "2026/06/20" }));

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Fecha solo puede tener un formato YYYY-MM-DD");
    });

    it("422 si la fecha no tiene 10 caracteres", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate: "2026-6-20" }));

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("El tamaño de la fecha debe ser de 10 caracteres");
    });

    it("422 si la descripción excede 200 caracteres", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ description: "a".repeat(201) }));

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Descripción no puede ser mayor a 200 caracteres");
    });

    it("422 si la descripción contiene emojis", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ description: "Reposo medico 😀" }));

        expect(res.statusCode).toBe(422);
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

    it("406 si un evento global libre cubre todos los días hábiles", async () => {
        const { startDate, endDate } = futureWorkWeekRange(6);
        const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

        await createEventType(
            IDS.globalFreeEventType,
            `Aus glob ${IDS.globalFreeEventType.slice(0, 8)}`,
        );

        await prisma.global_event.create({
            data: {
                global_event_id: randomUUID(),
                event_type_id: IDS.globalFreeEventType,
                start: eventRange.start,
                end: eventRange.end,
                name: "Ausencia global libre",
                description: "Días regalados por evento global",
                all_day: true,
                is_free_day: true,
            },
        });

        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate, endDate }));

        const absenceInDb = await prisma.absence.findFirst({
            where: {
                employee_id: IDS.employeeA,
                start: new Date(`${startDate}T00:00:00.000Z`),
                end: new Date(`${endDate}T00:00:00.000Z`),
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.message).toBe(
            "Dentro del rango seleccionado no hay ningún día hábil para asignar la ausencia",
        );
        expect(absenceInDb).toBeNull();
    });

    it("406 si un evento de casa libre cubre todos los días hábiles", async () => {
        const { startDate, endDate } = futureWorkWeekRange(7);
        const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

        await createEventType(
            IDS.houseFreeEventType,
            `Aus casa ${IDS.houseFreeEventType.slice(0, 8)}`,
        );

        await prisma.house_event.create({
            data: {
                house_event_id: randomUUID(),
                house_id: IDS.houseA,
                event_type_id: IDS.houseFreeEventType,
                start: eventRange.start,
                end: eventRange.end,
                name: "Ausencia casa libre",
                description: "Días regalados por evento de casa",
                all_day: true,
                is_free_day: true,
            },
        });

        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(validBody({ startDate, endDate }));

        const absenceInDb = await prisma.absence.findFirst({
            where: {
                employee_id: IDS.employeeA,
                start: new Date(`${startDate}T00:00:00.000Z`),
                end: new Date(`${endDate}T00:00:00.000Z`),
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.message).toBe(
            "Dentro del rango seleccionado no hay ningún día hábil para asignar la ausencia",
        );
        expect(absenceInDb).toBeNull();
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
                    role: "Cuidador",
                    privileges: ["addAbsences"],
                })}`,
            )
            .send(validBody());

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Permisos insuficientes");
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
            expect(res.body.message).toBe("Permisos insuficientes");
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

    it("201 registra ausencia tipo Otro con descripcion obligatoria", async () => {
        const res = await request(app)
            .post(`/absence/${IDS.employeeA}/add`)
            .set("Authorization", `Bearer ${sign()}`)
            .send(
                validBody({
                    absenceTypeId: IDS.absenceTypeOtro,
                    startDate: validStartDate(10),
                    endDate: validEndDate(10),
                    description: "Motivo personal no cubierto por otros tipos",
                }),
            );

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.absence).toMatchObject({
            employeeId: IDS.employeeA,
            absenceTypeId: IDS.absenceTypeOtro,
            description: "Motivo personal no cubierto por otros tipos",
            isDeleted: false,
        });

        const absenceInDb = await prisma.absence.findUnique({
            where: { absence_id: res.body.data.absence.absenceId },
        });
        expect(absenceInDb).toMatchObject({
            employee_id: IDS.employeeA,
            absence_type_id: IDS.absenceTypeOtro,
            description: "Motivo personal no cubierto por otros tipos",
        });
    });
});
