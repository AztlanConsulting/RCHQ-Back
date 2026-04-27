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
    db: process.env.DATABASE_URL,
  },
});

// ─── IDs fijos para poder referenciarlos en los tests ───────────────────────
const IDS = {
  house:    "a1b2c3d4-0000-0000-0000-000000000001",
  role:     "a1b2c3d4-0000-0000-0000-000000000002",
  employee: "a1b2c3d4-0000-0000-0000-000000000003",
};

// ─── Datos de prueba ─────────────────────────────────────────────────────────
const SEED = {
  house: {
    house_id:     IDS.house,
    name:         "Casa Hogar Querétaro",
    location:     "Querétaro, México",
    phone_number: "4421234567",
    description:  "Casa hogar de prueba",
    image:        "casa.jpg",
  },
  role: {
    role_id: IDS.role,
    name:    "Coordinador",
  },
  // password será sobreescrito por passwordOverride cuando el test
  // necesita hacer login real con credenciales conocidas ("Test1234!")
  employee: {
    employee_id:          IDS.employee,
    house_id:             IDS.house,
    role_id:              IDS.role,
    name:                 "Juan",
    surname:              "Pérez",
    is_active:            true,
    email:                "juan.perez@test.org",
    password:             "$2b$10$placeholder_hash_replaced_by_seedDb_call",
    has_first_login:      false,
    curp:                 "PERJ900101HDFRZN01",
    rfc:                  "PERJ900101ABC",
    birth_date:           new Date("1990-01-01"),
    start_date:           new Date("2022-01-01"),
    nss:                  "12345678901",
    bank_account:         "012345678901234567",
    picture:              "https://cdn.example.com/foto.jpg",
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
  await prisma.house.upsert({
    where:  { house_id: IDS.house },
    update: {},
    create: SEED.house,
  });

  await prisma.role.upsert({
    where:  { role_id: IDS.role },
    update: {},
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

/**
 * Elimina los registros de prueba en orden inverso a las FK.
 */
async function cleanDb() {
  await prisma.employee.deleteMany({ where: { employee_id: IDS.employee } });
  await prisma.role.deleteMany({     where: { role_id:     IDS.role     } });
  await prisma.house.deleteMany({    where: { house_id:    IDS.house    } });
}

async function disconnectDb() {
  await prisma.$disconnect();
}

module.exports = { prisma, seedDb, cleanDb, disconnectDb, IDS, SEED };