// tests/integration/document.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const {deleteFileIfExists} = require("../../utils/deleteFile")
const fs = require("fs");
const path = require("path");

const clearUploadsFolder = () => {
    const uploadsPath = path.resolve(process.cwd(),"uploads/documents");

    if(fs.existsSync(uploadsPath)) {
        const files = fs.readdirSync(uploadsPath);
        for (const file of files) {
            if(file.toLowerCase().endsWith(".pdf")) {
                fs.unlinkSync(path.join(uploadsPath, file));
            }
        }
    }
};

const prisma = new PrismaClient();

const IDS = {
    house:    randomUUID(),
    role:     randomUUID(),
    employee: randomUUID(),
    stranger: randomUUID(),
    doc:      randomUUID(),
};

const PDF = Buffer.from("%PDF-1.4 dummy");

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.employee,
            houseId: IDS.house,
            role: "Administrador",
            tokenType: "SESSION",
            privileges: ["manageDocuments", "viewDocuments"],
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

// ─── Seed / Teardown ──────────────────────────────────────
const seed = async () => {
    await prisma.house.upsert({
        where: { house_id: IDS.house },
        update: {},
        create: {
            house_id:     IDS.house,
            name:         `DocTest House ${IDS.house}`,
            location:     "Loc",
            phone_number: "4421234567",
            description:  "test",
            image:        "img.jpg",
        },
    });

    const existingRole = await prisma.role.findFirst({ where: { name: "administrador_doc_test" } });
    if (existingRole) {
        IDS.role = existingRole.role_id;
    } else {
        await prisma.role.create({ data: { role_id: IDS.role, name: "administrador_doc_test" } });
    }

    const empBase = {
        house_id:        IDS.house,
        role_id:         IDS.role,
        password:        "hashed",
        name:            "Test",
        surname:         "User",
        start_date:      new Date(),
        is_active:       true,
        has_first_login: true,
        type:            "nomina",
    };

    for (const { email, id } of [
        { email: "docmain@test.com",    id: IDS.employee },
        { email: "docstranger@test.com", id: IDS.stranger },
    ]) {
        const old = await prisma.employee.findFirst({ where: { email } });
        if (old && old.employee_id !== id) {
            await prisma.logs.deleteMany({ where: { employee_id: old.employee_id } });
            await prisma.employee_documents.deleteMany({ where: { employee_id: old.employee_id } });
            await prisma.employee.delete({ where: { employee_id: old.employee_id } });
        }
    }

    await prisma.employee.upsert({
        where:  { employee_id: IDS.employee },
        update: {},
        create: { employee_id: IDS.employee, email: "docmain@test.com", curp: "MOXC801103MBSCYE80", ...empBase },
    });

    await prisma.employee.upsert({
        where:  { employee_id: IDS.stranger },
        update: {},
        create: { employee_id: IDS.stranger, email: "docstranger@test.com", curp: "MOXC801103MBSCYE81", ...empBase },
    });

    await prisma.documents.upsert({
        where:  { document_id: IDS.doc },
        update: {},
        create: { document_id: IDS.doc, name: `doc_test_${IDS.doc}` },
    });
};

const clean = async () => {

    const docsToClean = await prisma.employee_documents.findMany({ 
        where: { employee_id: { in: [IDS.employee, IDS.stranger] } } 
    });

    for (const doc of docsToClean) {
        if (doc.url) deleteFileIfExists(doc.url);
    }

    await prisma.employee_documents.deleteMany({ where: { employee_id: { in: [IDS.employee, IDS.stranger] } } });
    await prisma.logs.deleteMany({ where: { employee_id: { in: [IDS.employee, IDS.stranger] } } });
    await prisma.employee.deleteMany({ where: { employee_id: { in: [IDS.employee, IDS.stranger] } } });
    await prisma.documents.deleteMany({ where: { document_id: IDS.doc } });
    await prisma.role.deleteMany({ where: { role_id: IDS.role } });
    await prisma.house.deleteMany({ where: { house_id: IDS.house } });
};

beforeAll(async () => {
    clearUploadsFolder();
     await clean(); 
     await seed(); 
    });

afterAll(async () => { 
    clearUploadsFolder();
    await clean(); 
    await prisma.$disconnect(); });
afterEach(async () => {

    const docs = await prisma.employee_documents.findMany({ 
        where: { employee_id: IDS.employee } 
    });
    
    for (const doc of docs) {
        if (doc.url) deleteFileIfExists(doc.url);
    }
    clearUploadsFolder();
    await prisma.employee_documents.deleteMany({ where: { employee_id: IDS.employee } });
});

// ─── Helper ───────────────────────────────────────────────
const upload = (employeeId, docId, token) =>
    request(app)
        .post(`/employee/${employeeId}/documents`)
        .set("Authorization", `Bearer ${token}`)
        .field("documentField", docId)
        .attach("file", PDF, "test.pdf");

// ═══════════════════════════════════════════════════════════
// AUTH & AUTORIZACIÓN
// ═══════════════════════════════════════════════════════════
describe("Autenticación y autorización", () => {
    it("401 — sin token", async () => {
        const res = await request(app).get(`/employee/${IDS.employee}/documents`);
        expect(res.statusCode).toBe(401);
    });

    it("401 — token con firma inválida", async () => {
        const res = await request(app)
            .get(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${sign()}xyz`);
        expect(res.statusCode).toBe(401);
    });

    it("401 — token expirado", async () => {
        const expired = jwt.sign(
            { id: IDS.employee, tokenType: "SESSION" },
            process.env.JWT_SECRET,
            { expiresIn: "-1s" },
        );
        const res = await request(app)
            .post(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${expired}`)
            .attach("file", PDF, "test.pdf");
        expect(res.statusCode).toBe(401);
    });

    it("403 — rol sin acceso a modifyDocuments", async () => {
        // Token con rol que la policy rechaza
        const token = sign({ role: "Empleado" });
        const res = await upload(IDS.employee, IDS.doc, token);
        expect(res.statusCode).toBe(403);
    });

    it("403 — rol sin acceso a viewDocuments", async () => {
        const token = sign({ id: IDS.stranger, role: "Empleado" });
        const res = await request(app)
            .get(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════
// POST /:id/documents
// ═══════════════════════════════════════════════════════════
describe("POST /:id/documents", () => {
    let token;
    beforeAll(() => { token = sign(); });

    it("400 — sin archivo (solo field)", async () => {
        const res = await request(app)
            .post(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", PDF, "test.pdf");
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/faltan campos/i);
    });

    it("400 — documentField UUID inexistente en documents", async () => {
        const res = await upload(IDS.employee, randomUUID(), token);
        expect(res.statusCode).toBe(400);
    });

    it("404 — empleado inexistente", async () => {
        const res = await upload(randomUUID(), IDS.doc, token);
        expect(res.statusCode).toBe(404);
    });

    it("201 — sube correctamente y persiste en BD", async () => {
        const res = await upload(IDS.employee, IDS.doc, token);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        const row = await prisma.employee_documents.findFirst({ where: { employee_id: IDS.employee } });
        expect(row).not.toBeNull();
        expect(row.url).toMatch(/uploads\/documents\//);
    });

    it("409 — mismo documento dos veces", async () => {
        await upload(IDS.employee, IDS.doc, token);
        const res = await upload(IDS.employee, IDS.doc, token);
        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it("400 — UUID malformado en la URL (no es UUID válido)", async () => {
        const res = await upload("not-a-uuid", IDS.doc, token);
        expect([400, 404, 500]).toContain(res.statusCode);
    });

    it("400 — archivo .exe rechazado por uploadDocs", async () => {
        const res = await request(app)
            .post(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${token}`)
            .field("documentField", IDS.doc)
            .attach("file", Buffer.from("MZ header"), "malware.exe");
        expect(res.statusCode).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════
// PUT /:id/documents/:field
// ═══════════════════════════════════════════════════════════
describe("PUT /:id/documents/:field", () => {
    let token;
    beforeAll(() => { token = sign(); });
    beforeEach(async () => { await upload(IDS.employee, IDS.doc, token); });

    it("200 — actualiza el documento existente", async () => {
        const res = await request(app)
            .put(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", PDF, "updated.pdf");
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("400 — sin archivo", async () => {
        const res = await request(app)
            .put(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
    });

    it("400 — field UUID inexistente", async () => {
        const res = await request(app)
            .put(`/employee/${IDS.employee}/documents/${randomUUID()}`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", PDF, "x.pdf");
        expect(res.statusCode).toBe(400);
    });

    it("404 — empleado inexistente", async () => {
        const res = await request(app)
            .put(`/employee/${randomUUID()}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", PDF, "x.pdf");
        expect(res.statusCode).toBe(404);
    });

    it("404 — documento no subido previamente", async () => {
        await prisma.employee_documents.deleteMany({ where: { employee_id: IDS.employee } });
        const res = await request(app)
            .put(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", PDF, "x.pdf");
        expect(res.statusCode).toBe(404);
    });
});

// ═══════════════════════════════════════════════════════════
// DELETE /:id/documents/:field
// ═══════════════════════════════════════════════════════════
describe("DELETE /:id/documents/:field", () => {
    let token;
    beforeAll(() => { token = sign(); });
    beforeEach(async () => { await upload(IDS.employee, IDS.doc, token); });

    it("200 — elimina y desaparece de BD", async () => {
        const res = await request(app)
            .delete(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        const row = await prisma.employee_documents.findFirst({ where: { employee_id: IDS.employee } });
        expect(row).toBeNull();
    });

    it("404 — idempotencia negativa (ya eliminado)", async () => {
        await request(app)
            .delete(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`);
        const res = await request(app)
            .delete(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });

    it("404 — empleado inexistente", async () => {
        const res = await request(app)
            .delete(`/employee/${randomUUID()}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });

    it("403 — rol sin privilegio no puede eliminar", async () => {
        const noPriv = sign({ role: "Empleado" });
        const res = await request(app)
            .delete(`/employee/${IDS.employee}/documents/${IDS.doc}`)
            .set("Authorization", `Bearer ${noPriv}`);
        expect(res.statusCode).toBe(403);
    });
});

// ═══════════════════════════════════════════════════════════
// GET /:id/documents
// ═══════════════════════════════════════════════════════════
describe("GET /:id/documents", () => {
    let token;
    beforeAll(() => { token = sign(); });

    it("200 — retorna documentos del empleado", async () => {
        await upload(IDS.employee, IDS.doc, token);
        const res = await request(app)
            .get(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("200 — array vacío para empleado sin documentos", async () => {
        const res = await request(app)
            .get(`/employee/${IDS.stranger}/documents`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
    });

    it("404 — empleado inexistente", async () => {
        const res = await request(app)
            .get(`/employee/${randomUUID()}/documents`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
    });

    it("403 — IDOR: rol Empleado con id distinto no puede ver documentos de otro", async () => {
        const strangerToken = sign({ id: IDS.stranger, role: "Empleado" });
        const res = await request(app)
            .get(`/employee/${IDS.employee}/documents`)
            .set("Authorization", `Bearer ${strangerToken}`);
        expect(res.statusCode).toBe(403);
    });
});
