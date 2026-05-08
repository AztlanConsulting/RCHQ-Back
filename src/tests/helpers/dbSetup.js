// tests/integration/helpers/dbSetup.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
    },
});

// ─── IDs fijos ───────────────────────────────────────────────────────────────
const IDS = {
    house: "a1b2c3d4-0000-0000-0000-000000000001",
    role: "a1b2c3d4-0000-0000-0000-000000000002",
    employee: "a1b2c3d4-0000-0000-0000-000000000003",
};

// ─── Actions requeridas por createLog ────────────────────────────────────────
const SEED_ACTIONS = [
    { action_id: "auth-001", description: "Login fallido", important: false },
    { action_id: "auth-002", description: "Cuenta bloqueada", important: true },
    { action_id: "auth-003", description: "Login exitoso", important: false },
    {
        action_id: "auth-004",
        description: "Primer login pendiente",
        important: false,
    },
    {
        action_id: "auth-005",
        description: "Contraseña primer login",
        important: true,
    },
    {
        action_id: "auth-006",
        description: "Primer login completado",
        important: false,
    },
    {
        action_id: "auth-007",
        description: "2FA setup exitoso",
        important: true,
    },
    {
        action_id: "auth-008",
        description: "2FA setup fallido",
        important: false,
    },
    {
        action_id: "auth-009",
        description: "2FA login fallido",
        important: false,
    },
    {
        action_id: "auth-010",
        description: "2FA login exitoso",
        important: false,
    },
    {
        action_id: "auth-011",
        description: "2FA deshabilitado",
        important: true,
    },
    {
        action_id: "auth-012",
        description: "Acceso denegado inactivo",
        important: true,
    },
    {
        action_id: "auth-013",
        description: "Cambio pwd inactivo",
        important: true,
    },
    {
        action_id: "auth-014",
        description: "2FA setup inactivo",
        important: true,
    },
    {
        action_id: "auth-015",
        description: "2FA verify inactivo",
        important: true,
    },
    {
        action_id: "auth-016",
        description: "2FA validate inactivo",
        important: true,
    },
    {
        action_id: "auth-017",
        description: "2FA disable inactivo",
        important: true,
    },
    {
        action_id: "auth-018",
        description: "2FA disable pwd incorrecta",
        important: true,
    },
    { action_id: "auth-019", description: "2FA bloqueado", important: true },
    {
        action_id: "auth-020",
        description: "Cambio de contraseña exitoso",
        important: false,
    },
    {
        action_id: "auth-021",
        description: "Cambio pwd usuario inactivo",
        important: true,
    },
    {
        action_id: "auth-022",
        description: "Fallo cambio pwd por pwd incorrecta",
        important: true,
    },
    { action_id: "empl-001", description: "Empleado creado", important: true },
    {
        action_id: "empl-002",
        description: "Documento de empleado subido",
        important: false,
    },
    {
        action_id: "empl-003",
        description: "Documento de empleado actualizado",
        important: false,
    },
    {
        action_id: "empl-004",
        description: "Documento de empleado eliminado",
        important: false,
    },
    {
        action_id: "vaca-001",
        description: "Solicitud de vacaciones creada",
        important: false,
    },
];

// ─── Datos de prueba ─────────────────────────────────────────────────────────
const SEED = {
    house: {
        house_id: IDS.house,
        name: "Casa de Desarrollo",
        location: "Querétaro, México",
        phone_number: "4421234567",
        description: "Casa hogar de prueba",
        image: "casa.jpg",
    },
    role: {
        role_id: IDS.role,
        name: "Admin",
    },
    employee: {
        employee_id: IDS.employee,
        house_id: IDS.house,
        role_id: IDS.role,
        name: "Carlos",
        surname: "Ramírez",
        type: "permanente",
        is_active: true,
        email: "andre@gmail.com",
        password: "$2b$10$placeholder_hash_replaced_by_seedDb_call",
        has_first_login: false,
        is_active_two_factor_auth: false,
        failed_login_attempts: 0,
        failed_two_factor_auth_attempts: 0,
        curp: "PERJ900101HDFRZN01",
        rfc: "PERJ900101ABC",
        birth_date: new Date("1990-01-01"),
        start_date: new Date("2022-01-01"),
        nss: "99999999901",
        bank_account: "012345678901234567",
        picture: "https://cdn.example.com/foto.jpg",
    },
};

/**
 * Inserta los registros mínimos necesarios en la DB de test.
 * Usa upsert para ser idempotente (seguro correrlo varias veces).
 *
 * @param {object} options
 * @param {string} [options.passwordOverride] - Hash bcrypt para el empleado.
 *   Usar cuando el test necesita login real: await bcrypt.hash("Andatti67", 10)
 */
async function seedDb({ passwordOverride } = {}) {
    await cleanDb();

    for (const action of SEED_ACTIONS) {
        await prisma.action.upsert({
            where: { action_id: action.action_id },
            update: {},
            create: action,
        });
    }

    await prisma.house.upsert({
        where:  { house_id: IDS.house },
        update: { name: SEED.house.name },
        create: SEED.house,
    });

    const existingRole = await prisma.role.findUnique({ where: { name: SEED.role.name } });
    if (existingRole) {
        IDS.role = existingRole.role_id;
        SEED.employee.role_id = existingRole.role_id;
    } else {
        await prisma.role.create({ data: SEED.role });
    }

    const oldByEmail = await prisma.employee.findFirst({
        where: { email: SEED.employee.email },
    });
    if (oldByEmail && oldByEmail.employee_id !== IDS.employee) {
        await prisma.logs.deleteMany({ where: { employee_id: oldByEmail.employee_id } });
        await prisma.employee_documents.deleteMany({ where: { employee_id: oldByEmail.employee_id } });
        await prisma.employee.delete({ where: { employee_id: oldByEmail.employee_id } });
    }

    const employeeData = {
        ...SEED.employee,
        ...(passwordOverride ? { password: passwordOverride } : {}),
    };

    await prisma.employee.upsert({
        where:  { employee_id: IDS.employee },
        update: { password: employeeData.password, role_id: IDS.role },
        create: employeeData,
    });
}

async function cleanDb() {
  await prisma.logs.deleteMany();
  await prisma.employee_documents.deleteMany();
  await prisma.documents.deleteMany();

  await prisma.employee_address.deleteMany();
  await prisma.vacations_request.deleteMany();

  await prisma.employee_fault.deleteMany();
  await prisma.fault.deleteMany();

  await prisma.employee_workday.deleteMany();

  await prisma.employee_personal_event.deleteMany();
  await prisma.personal_event.deleteMany();
  await prisma.house_event.deleteMany();
  await prisma.global_event.deleteMany();
  await prisma.event_type.deleteMany();

  await prisma.employee.deleteMany();

  await prisma.role.deleteMany({ where: { role_id: IDS.role } });
  await prisma.role.deleteMany({ where: { name: SEED.role.name } });
  await prisma.house.deleteMany({ where: { house_id: IDS.house } });
  await prisma.house.deleteMany({ where: { name: SEED.house.name } });
}

async function disconnectDb() {
    await prisma.$disconnect();
}

module.exports = { prisma, seedDb, cleanDb, disconnectDb, IDS, SEED };
