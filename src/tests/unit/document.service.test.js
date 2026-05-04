// tests/unit/document.unit.test.js
const { uploadDocument } = require("../../service/employee/create.service");
const { updateDocument } = require("../../service/employee/update.service");
const { deleteDocument } = require("../../service/employee/delete.service");
const { getDocumentsByEmployee } = require("../../service/employee/get.service");
const RESPONSES = require("../../utils/responses");

// ─── Mocks ────────────────────────────────────────────────
jest.mock("../../model/employee/get.model");
jest.mock("../../model/employee/create.model");
jest.mock("../../model/employee/delete.model");
jest.mock("../../model/employee/update.model");

const readModel  = require("../../model/employee/get.model");
const createModel = require("../../model/employee/create.model");
const deleteModel = require("../../model/employee/delete.model");
const updateModel = require("../../model/employee/update.model");

// Evitar que deleteFileIfExists explote en unit tests
jest.mock("../../utils/deleteFile", () => ({ deleteFileIfExists: jest.fn() }));
const { deleteFileIfExists } = require("../../utils/deleteFile");

// ─── Fixtures ─────────────────────────────────────────────
const EMP_ID   = "emp-uuid-123";
const DOC_ID   = "doc-uuid-456";  // UUID real de un tipo de documento
const BAD_ID   = "not-a-uuid";
const FILE     = { filename: "test.pdf", path: "uploads/documents/test.pdf" };
const FILE_URL = `uploads/documents/${FILE.filename}`;
const MOCK_EMP = { employee_id: EMP_ID };
const MOCK_DOC_TYPE = { document_id: DOC_ID, name: "cv" };
const MOCK_EXISTING = { document_id: DOC_ID, employee_id: EMP_ID, url: "uploads/documents/old.pdf" };

beforeEach(() => jest.clearAllMocks());

// ═══════════════════════════════════════════════════════════
// uploadDocument
// ═══════════════════════════════════════════════════════════
describe("uploadDocument", () => {
    it("NOT_ALLOW — documentId no existe en la tabla documents", async () => {
        readModel.findDocumentById.mockResolvedValue(null);

        const result = await uploadDocument(EMP_ID, FILE, BAD_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_ALLOW);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
        expect(readModel.findById).not.toHaveBeenCalled();
    });

    it("USER.NOT_FOUND — empleado inexistente", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(null);

        const result = await uploadDocument(EMP_ID, FILE, DOC_ID);

        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
    });

    it("ALREADY_EXIST — el par (employee, document) ya existe", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue(MOCK_EXISTING);

        const result = await uploadDocument(EMP_ID, FILE, DOC_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.ALREADY_EXISTS);
        expect(result.body.field).toBe(DOC_ID);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
        expect(createModel.createEmployeeDocument).not.toHaveBeenCalled();
    });

    it("UPLOAD — crea el registro correctamente cuando no existe", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue(null);
        createModel.createEmployeeDocument.mockResolvedValue({ employee_id: EMP_ID, document_id: DOC_ID, url: FILE_URL });

        const result = await uploadDocument(EMP_ID, FILE, DOC_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.UPLOADED);
        expect(createModel.createEmployeeDocument).toHaveBeenCalledWith(EMP_ID, DOC_ID, FILE_URL);
        expect(result.body.success).toBe(true);
    });

    it("lanza error si createEmployeeDocument falla (el archivo se limpia)", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue(null);
        createModel.createEmployeeDocument.mockRejectedValue(new Error("DB down"));

        await expect(uploadDocument(EMP_ID, FILE, DOC_ID)).rejects.toThrow("DB down");
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE_URL);
    });
});

// ═══════════════════════════════════════════════════════════
// updateDocument
// ═══════════════════════════════════════════════════════════
describe("updateDocument", () => {
    it("NOT_ALLOW — documentId no existe", async () => {
        readModel.findDocumentById.mockResolvedValue(null);

        const result = await updateDocument(EMP_ID, BAD_ID, FILE);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_ALLOW);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
    });

    it("USER.NOT_FOUND — empleado inexistente", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(null);

        const result = await updateDocument(EMP_ID, DOC_ID, FILE);

        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
    });

    it("DOCUMENTS.NOT_FOUND — el par (employee, document) no existe aún", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue(null);

        const result = await updateDocument(EMP_ID, DOC_ID, FILE);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
        expect(deleteFileIfExists).toHaveBeenCalledWith(FILE.path);
        expect(updateModel.updateEmployeeDocument).not.toHaveBeenCalled();
    });

    it("UPLOAD — actualiza y borra el archivo anterior", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue(MOCK_EXISTING);
        updateModel.updateEmployeeDocument.mockResolvedValue({ ...MOCK_EXISTING, url: FILE_URL });

        const result = await updateDocument(EMP_ID, DOC_ID, FILE);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.UPLOADED);
        expect(updateModel.updateEmployeeDocument).toHaveBeenCalledWith(EMP_ID, DOC_ID, FILE_URL);
        // El archivo viejo debe eliminarse
        expect(deleteFileIfExists).toHaveBeenCalledWith(MOCK_EXISTING.url);
    });

    it("UPLOAD — no intenta borrar archivo anterior si url era null", async () => {
        readModel.findDocumentById.mockResolvedValue(MOCK_DOC_TYPE);
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.findEmployeeDocument.mockResolvedValue({ ...MOCK_EXISTING, url: null });
        updateModel.updateEmployeeDocument.mockResolvedValue({ ...MOCK_EXISTING, url: FILE_URL });

        await updateDocument(EMP_ID, DOC_ID, FILE);

        // deleteFileIfExists solo se llama con el nuevo si falla, no con null
        expect(deleteFileIfExists).not.toHaveBeenCalledWith(null);
    });
});

// ═══════════════════════════════════════════════════════════
// deleteDocument
// ═══════════════════════════════════════════════════════════
describe("deleteDocument", () => {
    it("DOCUMENTS.NOT_FOUND — el par (employee, document) no existe", async () => {
        readModel.findEmployeeDocument.mockResolvedValue(null);

        const result = await deleteDocument(EMP_ID, DOC_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
        expect(deleteModel.deleteEmployeeDocument).not.toHaveBeenCalled();
    });

    it("DELETED — elimina el registro y el archivo físico", async () => {
        readModel.findEmployeeDocument.mockResolvedValue(MOCK_EXISTING);
        deleteModel.deleteEmployeeDocument.mockResolvedValue(true);

        const result = await deleteDocument(EMP_ID, DOC_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.DELETED);
        expect(deleteModel.deleteEmployeeDocument).toHaveBeenCalledWith(EMP_ID, DOC_ID);
        expect(deleteFileIfExists).toHaveBeenCalledWith(MOCK_EXISTING.url);
        expect(result.body.success).toBe(true);
    });

    it("DELETED — funciona aunque url sea null (sin archivo físico)", async () => {
        readModel.findEmployeeDocument.mockResolvedValue({ ...MOCK_EXISTING, url: null });
        deleteModel.deleteEmployeeDocument.mockResolvedValue(true);

        const result = await deleteDocument(EMP_ID, DOC_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.DELETED);
        // deleteFileIfExists se llama con null, es su responsabilidad no explotar
        expect(deleteFileIfExists).not.toHaveBeenCalled();
    });

    it("propaga el error si deleteEmployeeDocument falla", async () => {
        readModel.findEmployeeDocument.mockResolvedValue(MOCK_EXISTING);
        deleteModel.deleteEmployeeDocument.mockRejectedValue(new Error("FK constraint"));

        await expect(deleteDocument(EMP_ID, DOC_ID)).rejects.toThrow("FK constraint");
    });
});

// ═══════════════════════════════════════════════════════════
// getDocumentsByEmployee
// ═══════════════════════════════════════════════════════════
describe("getDocumentsByEmployee", () => {
    it("USER.NOT_FOUND — empleado no existe", async () => {
        readModel.findById.mockResolvedValue(null);

        const result = await getDocumentsByEmployee(EMP_ID);

        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
        expect(readModel.getDocumentsByEmployee).not.toHaveBeenCalled();
    });

    it("DOCUMENTS.NOT_FOUND — empleado existe pero no tiene documentos", async () => {
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.getDocumentsByEmployee.mockResolvedValue([]);

        const result = await getDocumentsByEmployee(EMP_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
        expect(result.body).toEqual([]);
    });

    it("DOCUMENTS.OK — mapea correctamente los documentos", async () => {
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.getDocumentsByEmployee.mockResolvedValue([
            { document_id: DOC_ID, url: FILE_URL, documents: { name: "cv" } },
        ]);

        const result = await getDocumentsByEmployee(EMP_ID);

        expect(result.type).toBe(RESPONSES.DOCUMENTS.OK);
        expect(result.body).toEqual([
            { documentId: DOC_ID, name: "cv", url: FILE_URL },
        ]);
    });

    it("DOCUMENTS.OK — maneja múltiples documentos sin mezclar datos", async () => {
        const secondDocId = "doc-uuid-789";
        readModel.findById.mockResolvedValue(MOCK_EMP);
        readModel.getDocumentsByEmployee.mockResolvedValue([
            { document_id: DOC_ID,      url: "uploads/documents/cv.pdf",  documents: { name: "cv" } },
            { document_id: secondDocId, url: "uploads/documents/nss.pdf", documents: { name: "nss" } },
        ]);

        const result = await getDocumentsByEmployee(EMP_ID);

        expect(result.body).toHaveLength(2);
        expect(result.body[0].name).toBe("cv");
        expect(result.body[1].name).toBe("nss");
    });
});