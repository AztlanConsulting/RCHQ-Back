const {
    uploadDocument,
    updateDocument,
} = require("../../service/employee/create.service");
const { deleteDocument } = require("../../service/employee/delete.service");
const {
    getDocumentsByEmployee,
} = require("../../service/employee/get.service");
const RESPONSES = require("../../utils/responses");

// ─── Mocks ────────────────────────────────────────────────
jest.mock("../../model/employee/get.model");
jest.mock("../../model/employee/create.model");
jest.mock("../../model/employee/delete.model");

const readModel = require("../../model/employee/get.model");
const createModel = require("../../model/employee/create.model");
const deleteModel = require("../../model/employee/delete.model");
const fs = require("fs");

jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

// ─── Fixtures ─────────────────────────────────────────────
const TEST_EMPLOYEE_ID = "emp-123";
const VALID_FIELD = "cv";
const INVALID_FIELD = "invalid_field";
const MOCK_FILE = { filename: "test-file.pdf" };
const FILE_URL = `uploads/documents/${MOCK_FILE.filename}`;

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── UPLOAD DOCUMENT ──────────────────────────────────────
describe("uploadDocument service", () => {
    it("retorna NOT_ALLOW si el tipo de documento es inválido", async () => {
        const result = await uploadDocument(
            TEST_EMPLOYEE_ID,
            MOCK_FILE,
            INVALID_FIELD,
        );
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_ALLOW);
        expect(result.body.success).toBe(false);
    });

    it("retorna USER.NOT_FOUND si el empleado no existe", async () => {
        readModel.findById.mockResolvedValue(null);
        const result = await uploadDocument(
            TEST_EMPLOYEE_ID,
            MOCK_FILE,
            VALID_FIELD,
        );
        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
        expect(readModel.findById).toHaveBeenCalledWith(TEST_EMPLOYEE_ID);
    });

    it("retorna ALREADY_EXIST si el campo ya tiene un documento", async () => {
        // Arrange
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue({
            document_id: "doc-1",
            documents: {
                [VALID_FIELD]: "uploads/documents/existing.pdf",
            },
        });

        // Act
        const result = await uploadDocument(
            TEST_EMPLOYEE_ID,
            MOCK_FILE,
            VALID_FIELD,
        );

        // Assert
        expect(result.type).toBe(RESPONSES.DOCUMENTS.ALREADY_EXIST);
        expect(result.body.success).toBe(false);
        expect(result.body.field).toBe(VALID_FIELD);
        expect(createModel.createDocumentRowWithUrl).not.toHaveBeenCalled();
        expect(createModel.updateDocumentField).not.toHaveBeenCalled();
    });

    it("crea un nuevo registro si el empleado no tiene ningún documento previo", async () => {
        // Arrange
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue(null);
        createModel.createDocumentRowWithUrl.mockResolvedValue({ id: "doc-1" });

        // Act
        const result = await uploadDocument(
            TEST_EMPLOYEE_ID,
            MOCK_FILE,
            VALID_FIELD,
        );

        // Assert
        expect(result.type).toBe(RESPONSES.DOCUMENTS.UPLOAD);
        expect(createModel.createDocumentRowWithUrl).toHaveBeenCalledWith(
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            FILE_URL,
        );
    });

    it("actualiza la fila existente si el empleado tiene otros documentos pero ese campo está vacío", async () => {
        // Arrange
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue({
            document_id: "doc-1",
            documents: {
                [VALID_FIELD]: null,
            },
        });
        createModel.updateDocumentField.mockResolvedValue({ id: "doc-1" });

        // Act
        const result = await uploadDocument(
            TEST_EMPLOYEE_ID,
            MOCK_FILE,
            VALID_FIELD,
        );

        // Assert
        expect(result.type).toBe(RESPONSES.DOCUMENTS.UPLOAD);
        expect(createModel.updateDocumentField).toHaveBeenCalledWith(
            "doc-1",
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            FILE_URL,
        );
        expect(createModel.createDocumentRowWithUrl).not.toHaveBeenCalled();
    });
});

// ─── UPDATE DOCUMENT ──────────────────────────────────────
describe("updateDocument service", () => {
    it("retorna NOT_ALLOW si el tipo de documento es inválido", async () => {
        const result = await updateDocument(
            TEST_EMPLOYEE_ID,
            INVALID_FIELD,
            MOCK_FILE,
        );
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_ALLOW);
    });

    it("retorna USER.NOT_FOUND si el empleado no existe", async () => {
        readModel.findById.mockResolvedValue(null);
        const result = await updateDocument(
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            MOCK_FILE,
        );
        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
    });

    it("retorna DOCUMENTS.NOT_FOUND si no existe fila de documentos", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue(null);
        const result = await updateDocument(
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            MOCK_FILE,
        );
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
    });

    it("actualiza el documento exitosamente", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue({
            document_id: "doc-1",
        });
        createModel.updateDocumentField.mockResolvedValue({
            id: "doc-1",
            [VALID_FIELD]: FILE_URL,
        });

        const result = await updateDocument(
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            MOCK_FILE,
        );

        expect(result.type).toBe(RESPONSES.DOCUMENTS.UPLOAD);
        expect(createModel.updateDocumentField).toHaveBeenCalledWith(
            "doc-1",
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
            FILE_URL,
        );
    });
});

// ─── DELETE DOCUMENT ──────────────────────────────────────
describe("deleteDocument service", () => {
    it("retorna NOT_ALLOW si el tipo de documento es inválido", async () => {
        const result = await deleteDocument(TEST_EMPLOYEE_ID, INVALID_FIELD);
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_ALLOW);
    });

    it("retorna USER.NOT_FOUND si el empleado no existe", async () => {
        readModel.findById.mockResolvedValue(null);
        const result = await deleteDocument(TEST_EMPLOYEE_ID, VALID_FIELD);
        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
    });

    it("retorna DOCUMENTS.NOT_FOUND si no hay registros", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue(null);
        const result = await deleteDocument(TEST_EMPLOYEE_ID, VALID_FIELD);
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
    });

    it("elimina el archivo y limpia la BD exitosamente", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        const mockDocRow = {
            document_id: "doc-1",
            documents: { [VALID_FIELD]: "uploads/test.pdf" },
        };
        readModel.findDocumentRowByEmployee.mockResolvedValue(mockDocRow);
        deleteModel.clearDocumentField.mockResolvedValue(true);
        fs.unlinkSync.mockImplementation(() => {});

        const result = await deleteDocument(TEST_EMPLOYEE_ID, VALID_FIELD);

        expect(fs.unlinkSync).toHaveBeenCalledWith("uploads/test.pdf");
        expect(deleteModel.clearDocumentField).toHaveBeenCalledWith(
            "doc-1",
            TEST_EMPLOYEE_ID,
            VALID_FIELD,
        );
        expect(result.type).toBe(RESPONSES.DOCUMENTS.DELETE);
    });
});

// ─── GET DOCUMENTS ────────────────────────────────────────
describe("getDocumentsByEmployee service", () => {
    it("retorna USER.NOT_FOUND si el empleado no existe", async () => {
        readModel.findById.mockResolvedValue(null);
        const result = await getDocumentsByEmployee(TEST_EMPLOYEE_ID);
        expect(result.type).toBe(RESPONSES.USER.NOT_FOUND);
    });

    it("retorna DOCUMENTS.NOT_FOUND si no tiene documentos", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue(null);
        const result = await getDocumentsByEmployee(TEST_EMPLOYEE_ID);
        expect(result.type).toBe(RESPONSES.DOCUMENTS.NOT_FOUND);
    });

    it("retorna DOCUMENTS.OK y el registro si existen documentos", async () => {
        readModel.findById.mockResolvedValue({ id: TEST_EMPLOYEE_ID });
        readModel.findDocumentRowByEmployee.mockResolvedValue({ cv: "url" });
        const result = await getDocumentsByEmployee(TEST_EMPLOYEE_ID);
        expect(result.type).toBe(RESPONSES.DOCUMENTS.OK);
        expect(result.body).toEqual({ cv: "url" });
    });
});
