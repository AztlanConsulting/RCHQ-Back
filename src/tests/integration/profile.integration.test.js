// tests/integration/profile.integration.test.js
/**
 * Pruebas de integración — GET /users/profile
 *
 * Estrategia:
 *  - Levanta la app Express real contra TEST_DATABASE_URL
 *  - Genera JWTs reales con JWT_SECRET
 *  - Usa supertest para hacer peticiones HTTP end-to-end
 *  - seedDb() antes de la suite, cleanDb() al terminar
 *
 * Requisitos previos:
 *  1. Crear una DB PostgreSQL dedicada para tests
 *  2. Agregar TEST_DATABASE_URL en .env.test
 *  3. Correr migraciones: DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
 *  4. npm install --save-dev supertest dotenv
 */

require("dotenv").config({ path: ".env.test" });

// Apuntar Prisma a la DB de test ANTES de importar la app
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../../index");
const { seedDb, cleanDb, disconnectDb, IDS } = require("./helpers/dbSetup");

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Helpers de token ────────────────────────────────────────────────────────
const makeSessionToken = (employeeId, expiresIn = "1h") =>
  jwt.sign(
    { id: employeeId, tokenType: "SESSION" },
    JWT_SECRET,
    { expiresIn }
  );

const makeWrongTypeToken = (employeeId) =>
  jwt.sign(
    { id: employeeId, tokenType: "REFRESH" },   // tipo incorrecto
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const makeExpiredToken = (employeeId) =>
  jwt.sign(
    { id: employeeId, tokenType: "SESSION" },
    JWT_SECRET,
    { expiresIn: "-1s" }                         // ya expiró
  );

const makeTokenWrongSecret = (employeeId) =>
  jwt.sign(
    { id: employeeId, tokenType: "SESSION" },
    "secreto-incorrecto",
    { expiresIn: "1h" }
  );

// ─── Suite ───────────────────────────────────────────────────────────────────
describe("GET /users/profile — integración", () => {
  beforeAll(async () => {
    await seedDb();
  });

  afterAll(async () => {
    await cleanDb();
    await disconnectDb();
  });

  // ── 200 — Flujo feliz ──────────────────────────────────────────────────────
  describe("200 — perfil encontrado", () => {
    it("retorna 200 con success:true y los datos del empleado", async () => {
      const token = makeSessionToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("retorna houseName y roleName como strings (no IDs)", async () => {
      const token = makeSessionToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.houseName).toBe("Casa Hogar Querétaro");
      expect(res.body.data.roleName).toBe("Coordinador");
    });

    it("retorna todos los campos esperados del perfil", async () => {
      const token = makeSessionToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      const { data } = res.body;
      expect(data).toMatchObject({
        houseName:   "Casa Hogar Querétaro",
        roleName:    "Coordinador",
        name:        "Juan",
        surname:     "Pérez",
        email:       "juan.perez@test.org",
        rfc:         "PERJ900101ABC",
        curp:        "PERJ900101HDFRZN01",
        nss:         "12345678901",
        bankAccount: "012345678901234567",
      });
    });

    it("NO expone el password en la respuesta", async () => {
      const token = makeSessionToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.password).toBeUndefined();
    });

    it("retorna birthDate como string ISO serializable", async () => {
      const token = makeSessionToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(typeof res.body.data.birthDate).toBe("string");
      expect(new Date(res.body.data.birthDate).getFullYear()).toBe(1990);
    });
  });

  // ── 401 — Sin token ────────────────────────────────────────────────────────
  describe("401 — token ausente o inválido", () => {
    it("retorna 401 cuando no se envía Authorization header", async () => {
      const res = await request(app).get("/users/profile");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Token no proporcionado");
    });

    it("retorna 401 cuando el header no empieza con 'Bearer '", async () => {
      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", "Token abc123");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token no proporcionado");
    });

    it("retorna 401 cuando el token está expirado", async () => {
      const token = makeExpiredToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token inválido o expirado");
    });

    it("retorna 401 cuando el token fue firmado con un secret incorrecto", async () => {
      const token = makeTokenWrongSecret(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token inválido o expirado");
    });

    it("retorna 401 con un token completamente malformado", async () => {
      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", "Bearer esto.no.es.un.jwt");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 403 — tokenType incorrecto ─────────────────────────────────────────────
  describe("403 — tokenType incorrecto", () => {
    it("retorna 403 cuando tokenType no es SESSION", async () => {
      const token = makeWrongTypeToken(IDS.employee);

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Token de sesión inválido");
    });
  });

  // ── 404 — empleado no existe en DB ─────────────────────────────────────────
  describe("404 — empleado no existe", () => {
    it("retorna 404 cuando el id del token no existe en la DB", async () => {
      const token = makeSessionToken("00000000-0000-0000-0000-000000000000");

      const res = await request(app)
        .get("/users/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Perfil no encontrado");
    });
  });
});