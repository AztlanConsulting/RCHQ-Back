// tests/integration/profile.flow.integration.test.js
/**
 * Prueba de integración — Flujo completo: Login → GET /user/profile
 *
 * Cubre:
 *  1. POST /auth/login   → obtiene SESSION token real
 *  2. GET  /user/profile → consume el token del paso 1
 *
 * La DB de test debe tener un empleado activo con contraseña conocida.
 * El seed usa bcrypt para hashear la contraseña igual que produciría
 * el sistema real.
 *
 * Requisitos:
 *   npm install --save-dev supertest dotenv bcrypt
 *   Correr con: npx jest tests/integration --runInBand
 */

require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../../index");
const { seedDb, cleanDb, disconnectDb, IDS } = require("../helpers/dbSetup");

// ─── Credenciales de prueba (deben coincidir con el seed) ────────────────────
const VALID_EMAIL = "andre@gmail.com";
const VALID_PASSWORD = "Andatti67";

// ─── Helper: hace login y retorna el SESSION token ───────────────────────────
const loginAndGetToken = async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

  // Falla rápido si el login no fue exitoso — el problema está en el seed
  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(
      `loginAndGetToken falló inesperadamente: ${JSON.stringify(res.body)}`,
    );
  }

  return res.body.data.token;
};

// ─── Suite ───────────────────────────────────────────────────────────────────
describe("Flujo integración: Login → GET /user/profile", () => {
  beforeAll(async () => {
    // Hash de la contraseña conocida para el seed
    const hashedPassword = await bcrypt.hash(VALID_PASSWORD, 10);
    await seedDb({ passwordOverride: hashedPassword });
  });

  afterAll(async () => {
    await cleanDb();
    await disconnectDb();
  });

  // ── PASO 1: Login ──────────────────────────────────────────────────────────
  describe("PASO 1 — POST /auth/login", () => {
    it("retorna 200 con token SESSION cuando las credenciales son válidas", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it("el token retornado tiene tokenType SESSION (verificable en /profile)", async () => {
      const token = await loginAndGetToken();
      // Si el token no fuera SESSION, el siguiente paso devolvería 403
      // Validamos indirectamente usándolo contra /user/profile
      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).not.toBe(403);
    });

    it("retorna 401 con credenciales inválidas (password incorrecta)", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: VALID_EMAIL, password: "WrongPassword!" });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("retorna 401 cuando el email no existe", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "noexiste@test.org", password: VALID_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("retorna 400 cuando el body no pasa la validación del schema", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "no-es-un-email", password: "" });

      expect(res.status).toBe(400);
    });

    it("retorna 400 cuando faltan campos requeridos", async () => {
      const res = await request(app).post("/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  // ── PASO 2: GET /auth/profile con token real del login ───────────────────
  describe("PASO 2 — GET /user/profile (con token del login)", () => {
    let sessionToken;

    beforeAll(async () => {
      sessionToken = await loginAndGetToken();
    });

    it("retorna 200 usando el token obtenido del login", async () => {
      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${sessionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("los datos del perfil coinciden con el empleado que hizo login", async () => {
      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${sessionToken}`);

      expect(res.body.data).toMatchObject({
        name: "Carlos",
        surname: "Ramírez",
        email: VALID_EMAIL,
        houseName: "Casa de Desarrollo",
        roleName: "Admin",
      });
    });

    it("el perfil no expone el password del empleado", async () => {
      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${sessionToken}`);

      expect(res.body.data.password).toBeUndefined();
    });
  });

  // ── Flujo completo encadenado en un solo test ─────────────────────────────
  describe("Flujo encadenado end-to-end", () => {
    it("Login exitoso → perfil retorna los datos del mismo usuario", async () => {
      // Paso 1: Login
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

      expect(loginRes.status).toBe(200);
      const { token, user: loginUser } = loginRes.body.data;

      // Paso 2: Perfil
      const profileRes = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(profileRes.status).toBe(200);

      // El empleado del login coincide con el del perfil
      expect(profileRes.body.data.email).toBe(loginUser.email);
      expect(profileRes.body.data.name).toBe(loginUser.name);
    });
  });

  // ── Flujos alternativos en /user/profile ─────────────────────────────────
  describe("Flujos alternativos — GET /user/profile", () => {
    it("401 — intenta acceder al perfil sin haber hecho login (sin token)", async () => {
      const res = await request(app).get("/user/profile");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("401 — token expirado no permite ver el perfil", async () => {
      const jwt = require("jsonwebtoken");
      const expToken = jwt.sign(
        { id: IDS.employee, tokenType: "SESSION" },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" },
      );

      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${expToken}`);

      expect(res.status).toBe(401);
    });

    it("403 — token con tokenType incorrecto no permite ver el perfil", async () => {
      const jwt = require("jsonwebtoken");
      const wrongToken = jwt.sign(
        { id: IDS.employee, tokenType: "REFRESH" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      const res = await request(app)
        .get("/user/profile")
        .set("Authorization", `Bearer ${wrongToken}`);

      expect(res.status).toBe(403);
    });
  });
});
