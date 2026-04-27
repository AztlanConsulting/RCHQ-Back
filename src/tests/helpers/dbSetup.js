// tests/integration/helpers/dbSetup.js
/**
 * Helper para pruebas de integración.
 * Usa un PrismaClient apuntando a la DB de test (TEST_DATABASE_URL).
 * Cada suite llama a seedDb() antes y a cleanDb() después.
 *
 * seedDb({ passwordOverride }) permite inyectar un hash bcrypt real
 * para que el login funcione con credenciales conocidas en el flujo completo.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
});

// ─── IDs fijos ───────────────────────────────────────────────────────────────
const IDS = {
  house:    "a1b2c3d4-0000-0000-0000-000000000001",
  role:     "a1b2c3d4-0000-0000-0000-000000000002",
  employee: "a1b2c3d4-0000-0000-0000-000000000003",
};

// ─── Actions requeridas por createLog ────────────────────────────────────────
const SEED_ACTIONS = [
  { action_id: "auth-001", description: "Login fallido",               important: false },
  { action_id: "auth-002", description: "Cuenta bloqueada",            important: true  },
  { action_id: "auth-003", description: "Login exitoso",               important: false },
  { action_id: "auth-004", description: "Primer login pendiente",      important: false },
  { action_id: "auth-005", description: "Contraseña primer login",     important: true  },
  { action_id: "auth-006", description: "Primer login completado",     important: false },
  { action_id: "auth-007", description: "2FA setup exitoso",           important: true  },
  { action_id: "auth-008", description: "2FA setup fallido",           important: false },
  { action_id: "auth-009", description: "2FA login fallido",           important: false },
  { action_id: "auth-010", description: "2FA login exitoso",           important: false },
  { action_id: "auth-011", description: "2FA deshabilitado",           important: true  },
  { action_id: "auth-012", description: "Acceso denegado inactivo",    important: true  },
  { action_id: "auth-013", description: "Cambio pwd inactivo",         important: true  },
  { action_id: "auth-014", description: "2FA setup inactivo",          important: true  },
  { action_id: "auth-015", description: "2FA verify inactivo",         important: true  },
  { action_id: "auth-016", description: "2FA validate inactivo",       important: true  },
  { action_id: "auth-017", description: "2FA disable inactivo",        important: true  },
  { action_id: "auth-018", description: "2FA disable pwd incorrecta",  important: true  },
  { action_id: "auth-019", description: "2FA bloqueado",               important: true  },
  { action_id: "empl-001", description: "Empleado creado",             important: true  },
];

// ─── Datos de prueba ─────────────────────────────────────────────────────────
const SEED = {
  house: {
    house_id:     IDS.house,
    name:         "Casa de Desarrollo",
    location:     "Querétaro, México",
    phone_number: "4421234567",
    description:  "Casa hogar de prueba",
    image:        "casa.jpg",
  },
role: {
    role_id: IDS.role,
    name:    "Admin",
  },
  // password será sobreescrito por passwordOverride cuando el test
  // necesita hacer login real con credenciales conocidas ("Test1234!")
  employee: {
    employee_id:     IDS.employee,
    house_id:        IDS.house,
    role_id:         IDS.role,
    name:            "Carlos",
    surname:         "Ramírez",
    is_active:       true,
    email:           "andre@gmail.com",
    password:        "$2b$10$placeholder_hash_replaced_by_seedDb_call",
    has_first_login: false,
    curp:            "PERJ900101HDFRZN01",
    rfc:             "PERJ900101ABC",
    birth_date:      new Date("1990-01-01"),
    start_date:      new Date("2022-01-01"),
    nss:             "99999999901",
    bank_account:    "012345678901234567",
    picture:         "https://cdn.example.com/foto.jpg",
  },
};

/**
 * Inserta los registros mínimos necesarios en la DB de test.
 * Usa upsert para ser idempotente (seguro correrlo varias veces).
 *
 * @param {object} options
 * @param {string} [options.passwordOverride] - Hash bcrypt para el empleado.
 *   Usar cuando el test necesita login real: await bcrypt.hash("Test1234!", 10)
 */
async function seedDb({ passwordOverride } = {}) {
  await cleanDb();

  // Seed actions
  for (const action of SEED_ACTIONS) {
    await prisma.action.upsert({
      where:  { action_id: action.action_id },
      update: {},
      create: action,
    });
  }

  await prisma.house.upsert({
    where:  { house_id: IDS.house },
    update: { name: SEED.house.name },
    create: SEED.house,
  });

  await prisma.role.upsert({
    where:  { role_id: IDS.role },
    update: { name: SEED.role.name },
    create: SEED.role,
  });

  const employeeData = {
    ...SEED.employee,
    ...(passwordOverride ? { password: passwordOverride } : {}),
  };

  await prisma.employee.upsert({
    where:  { employee_id: IDS.employee },
    update: { password: employeeData.password },
    create: employeeData,
  });
}

async function cleanDb() {
  await prisma.logs.deleteMany({     where: { employee_id: IDS.employee           } });
  await prisma.employee.deleteMany({ where: { employee_id: IDS.employee           } });
  await prisma.role.deleteMany({     where: { role_id:     IDS.role               } });
  await prisma.house.deleteMany({    where: { house_id:    IDS.house              } });
  await prisma.house.deleteMany({    where: { name:        SEED.house.name        } });
  await prisma.role.deleteMany({     where: { name:        SEED.role.name         } });
  await prisma.employee.deleteMany({ where: { email:       SEED.employee.email    } });
  await prisma.employee.deleteMany({ where: { curp:        SEED.employee.curp     } });
}

async function disconnectDb() {
  await prisma.$disconnect();
}

module.exports = { prisma, seedDb, cleanDb, disconnectDb, IDS, SEED };