// tests/integration/auth.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { seedActions } = require("../helpers/seedActions");

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
});

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_EMAIL = "integration@test.com";
const TEST_PASSWORD = "TestPass123";
const TEST_CURP = "TEST123456INTXXX01";

// ─── Helpers ──────────────────────────────────────────────
const seedDependencies = async () => {
  await prisma.house.upsert({
    where: { house_id: TEST_HOUSE_ID },
    update: {},
    create: {
      house_id: TEST_HOUSE_ID,
      name: "Casa de Prueba Integration",
      location: "Test Location",
      phone_number: "4421234567",
      description: "Casa usada solo para tests de integración",
      image: "test-image.jpg",
    },
  });
  await prisma.role.upsert({
    where: { role_id: TEST_ROLE_ID },
    update: {},
    create: {
      role_id: TEST_ROLE_ID,
      name: "test-role-integration",
    },
  });
};

const createTestEmployee = async (overrides = {}) => {
  const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 10);
  return prisma.employee.create({
    data: {
      employee_id: TEST_EMPLOYEE_ID,
      house_id: TEST_HOUSE_ID,
      role_id: TEST_ROLE_ID,
      email: TEST_EMAIL,
      password: hashedPwd,
      name: "Test",
      surname: "User",
      curp: TEST_CURP,
      start_date: new Date("2024-01-01"),
      has_first_login: false,
      is_active: true,
      is_active_2fa: false,
      failed_login_attempts: 0,
      ...overrides,
    },
  });
};

const generateSessionToken = () => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    {
      id: TEST_EMPLOYEE_ID,
      email: TEST_EMAIL,
      name: "Test User",
      role: "test-role-integration",
      privileges: [],
      tokenType: "SESSION",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

const cleanDb = async () => {
  await prisma.logs.deleteMany({ where: { employee_id: TEST_EMPLOYEE_ID } });
  await prisma.employee.deleteMany({ where: { email: TEST_EMAIL } });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
  await cleanDb();
  await seedDependencies();
  await seedActions();
});
afterEach(async () => {
  await cleanDb();
});
afterAll(async () => {
  await prisma.role.deleteMany({ where: { role_id: TEST_ROLE_ID } });
  await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
  await prisma.$disconnect();
});

// ─── LOGIN ────────────────────────────────────────────────
describe("POST /auth/login - integration", () => {
  it("retorna 200 y token con credenciales válidas", async () => {
    // Arrange
    await createTestEmployee();

    // Act
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
  });

  it("retorna 401 con contraseña incorrecta", async () => {
    // Arrange
    await createTestEmployee();

    // Act
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrongpass" });

    // Assert
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("retorna 401 si el usuario no existe", async () => {
    // Arrange — no se crea empleado

    // Act
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "noexiste@test.com", password: TEST_PASSWORD });

    // Assert
    expect(res.statusCode).toBe(401);
  });

  it("retorna 400 si el email tiene formato inválido", async () => {
    // Arrange — payload inválido

    // Act
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "notanemail", password: TEST_PASSWORD });

    // Assert
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("incrementa failed_login_attempts en BD al fallar", async () => {
    // Arrange
    await createTestEmployee();

    // Act
    await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrongpass" });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(emp.failed_login_attempts).toBe(1);
  });

  it("bloquea la cuenta en BD después de 3 intentos fallidos", async () => {
    // Arrange
    await createTestEmployee();

    // Act
    await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong" });
    await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong" });
    await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong" });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(emp.blocked_until).not.toBeNull();
  });

  it("retorna pre2FAToken cuando el usuario tiene 2FA activo", async () => {
    // Arrange
    await createTestEmployee({
      is_active_2fa: true,
      totp_secret: "FAKESECRET",
    });

    // Act
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("pre2FAToken");
    expect(res.body.isActive2FA).toBe(true);
  });

  it("limpia el estado de seguridad en BD tras login exitoso", async () => {
    // Arrange
    await createTestEmployee({ failed_login_attempts: 2 });

    // Act
    await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(emp.failed_login_attempts).toBe(0);
    expect(emp.blocked_until).toBeNull();
  });
});

// ─── SETUP 2FA ────────────────────────────────────────────
describe("POST /auth/2fa/setup - integration", () => {
  it("guarda temp_totp_secret en BD y retorna QR", async () => {
    // Arrange
    await createTestEmployee();
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/setup")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: TEST_EMPLOYEE_ID });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("qrImage");
    expect(res.body.nextStep).toBe("VERIFY_2FA_SETUP");
    expect(emp.temp_totp_secret).not.toBeNull();
  });

  it("retorna 409 si 2FA ya está configurado en BD", async () => {
    // Arrange
    await createTestEmployee({
      totp_secret: "EXISTINGSECRET",
      is_active_2fa: true,
    });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/setup")
      .set("Authorization", `Bearer ${token}`)
      .send({ id: TEST_EMPLOYEE_ID });

    // Assert
    expect(res.statusCode).toBe(409);
  });

  it("retorna 401 sin token de sesión", async () => {
    // Arrange — no se manda Authorization header

    // Act
    const res = await request(app)
      .post("/auth/2fa/setup")
      .send({ id: TEST_EMPLOYEE_ID });

    // Assert
    expect(res.statusCode).toBe(401);
  });
});

// ─── VERIFY 2FA SETUP ─────────────────────────────────────
describe("POST /auth/2fa/verify - integration", () => {
  it("retorna 409 si no hay setup pendiente en BD", async () => {
    // Arrange
    await createTestEmployee({ temp_totp_secret: null });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "123456" });

    // Assert
    expect(res.statusCode).toBe(409);
  });

  it("retorna 409 y limpia el secret en BD si el setup expiró", async () => {
    // Arrange
    await createTestEmployee({
      temp_totp_secret: "SECRETBASE32",
      temp_totp_secret_created_at: new Date(Date.now() - 20 * 60 * 1000),
    });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "123456" });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(res.statusCode).toBe(409);
    expect(emp.temp_totp_secret).toBeNull();
  });
});

// ─── DISABLE 2FA ──────────────────────────────────────────
describe("POST /auth/2fa/disable - integration", () => {
  it("desactiva 2FA y limpia secrets en BD con contraseña correcta", async () => {
    // Arrange
    await createTestEmployee({
      is_active_2fa: true,
      totp_secret: "FAKESECRET",
    });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: TEST_PASSWORD });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.nextStep).toBe("2FA_DISABLED");
    expect(emp.totp_secret).toBeNull();
    expect(emp.is_active_2fa).toBe(false);
  });

  it("retorna 401 con contraseña incorrecta y NO modifica la BD", async () => {
    // Arrange
    await createTestEmployee({
      is_active_2fa: true,
      totp_secret: "FAKESECRET",
    });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "wrongpass" });
    const emp = await prisma.employee.findUnique({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });

    // Assert
    expect(res.statusCode).toBe(401);
    expect(emp.totp_secret).toBe("FAKESECRET");
    expect(emp.is_active_2fa).toBe(true);
  });

  it("retorna 409 si 2FA no está activo en BD", async () => {
    // Arrange
    await createTestEmployee({ is_active_2fa: false, totp_secret: null });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: TEST_PASSWORD });

    // Assert
    expect(res.statusCode).toBe(409);
  });
});

// ─── GET STATUS 2FA ───────────────────────────────────────
describe("GET /auth/status/2FA - integration", () => {
  it("retorna false si 2FA no está activo en BD", async () => {
    // Arrange
    await createTestEmployee({ is_active_2fa: false });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .get("/auth/status/2FA")
      .set("Authorization", `Bearer ${token}`);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.Status2FA).toBe(false);
  });

  it("retorna true si 2FA está activo en BD", async () => {
    // Arrange
    await createTestEmployee({
      is_active_2fa: true,
      totp_secret: "FAKESECRET",
    });
    const token = generateSessionToken();

    // Act
    const res = await request(app)
      .get("/auth/status/2FA")
      .set("Authorization", `Bearer ${token}`);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.Status2FA).toBe(true);
  });

  it("retorna 401 sin token de sesión", async () => {
    // Arrange — no se manda Authorization header

    // Act
    const res = await request(app).get("/auth/status/2FA");

    // Assert
    expect(res.statusCode).toBe(401);
  });
});
