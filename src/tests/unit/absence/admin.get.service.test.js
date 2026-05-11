jest.mock("../../../model/absence/get.model", () => ({
  getAllAbsences: jest.fn(),
}));

jest.mock("../../../utils/mappers/absence.map", () => ({
  mapAbsence: jest.fn((a) => ({ ...a, mapped: true })),
}));

const { getAllAbsences: getAllAbsencesModel } = require("../../../model/absence/get.model");
const { getAllAbsences: getAllAbsencesService } = require("../../../service/absence/get.service");
const RESPONSES = require("../../../utils/responses");

// ─── Fixture ──────────────────────────────────────────────────────────────────

const MOCK_ABSENCE = {
  absence_id: "ab000001-0000-4000-8000-000000000001",
  start: new Date("2026-05-03"),
  end:   new Date("2026-05-07"),
  url:   "uploads/evidencia.pdf",
  description: "Reposo",
  absence_type: { name: "Médica" },
  employee: { name: "Carlos", picture: null, house: { name: "Desarrollo" } },
};

const MOCK_PAGINATION = { total: 1, page: 1, limit: 6, totalPages: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  getAllAbsencesModel.mockResolvedValue({
    data: [MOCK_ABSENCE],
    pagination: MOCK_PAGINATION,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BAD_REQUEST — validación de parámetros
// ══════════════════════════════════════════════════════════════════════════════

describe("getAllAbsences — BAD_REQUEST", () => {
  it("retorna BAD_REQUEST si page es undefined", async () => {
    const r = await getAllAbsencesService(undefined, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
    expect(getAllAbsencesModel).not.toHaveBeenCalled();
  });

  it("retorna BAD_REQUEST si limit es undefined", async () => {
    const r = await getAllAbsencesService(1, undefined);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });

  it("retorna BAD_REQUEST si page es NaN", async () => {
    const r = await getAllAbsencesService(NaN, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });

  it("retorna BAD_REQUEST si limit es NaN", async () => {
    const r = await getAllAbsencesService(1, NaN);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });

  it("retorna BAD_REQUEST si page < 1", async () => {
    const r = await getAllAbsencesService(0, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });

  it("retorna BAD_REQUEST si limit < 1", async () => {
    const r = await getAllAbsencesService(1, 0);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });

  it("retorna BAD_REQUEST si page es negativo", async () => {
    const r = await getAllAbsencesService(-1, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.BAD_REQUEST);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Flujo exitoso
// ══════════════════════════════════════════════════════════════════════════════

describe("getAllAbsences — flujo exitoso", () => {
  it("retorna FOUND con datos mapeados", async () => {
    const r = await getAllAbsencesService(1, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.FOUND);
    expect(r.success).toBe(true);
    expect(r.data[0].mapped).toBe(true);
    expect(r.pagination).toEqual(MOCK_PAGINATION);
  });

  it("retorna FOUND con data vacía si no hay ausencias", async () => {
    getAllAbsencesModel.mockResolvedValue({ data: [], pagination: { ...MOCK_PAGINATION, total: 0 } });
    const r = await getAllAbsencesService(1, 6);
    expect(r.type).toBe(RESPONSES.ABSENCE.FOUND);
    expect(r.data).toEqual([]);
  });

  it("limita el limit a 100 aunque se pase 999", async () => {
    await getAllAbsencesService(1, 999);
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1,
      100,
      expect.any(Object),
    );
  });

  it("pasa el where correcto al model con deleted=false por defecto", async () => {
    await getAllAbsencesService(1, 6, {});
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ is_deleted: false }),
    );
  });

  it("pasa is_deleted:true cuando filters.deleted='true'", async () => {
    await getAllAbsencesService(1, 6, { deleted: "true" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ is_deleted: true }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildWhere — construcción de filtros
// ══════════════════════════════════════════════════════════════════════════════

describe("getAllAbsences — filtros en where", () => {
  it("incluye filtro de nombre en employee", async () => {
    await getAllAbsencesService(1, 6, { name: "Carlos" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({
        employee: expect.objectContaining({
          name: { contains: "Carlos", mode: "insensitive" },
        }),
      }),
    );
  });

  it("incluye filtro de evidencia 'con' como url not null", async () => {
    await getAllAbsencesService(1, 6, { evidence: "con" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ url: { not: null } }),
    );
  });

  it("incluye filtro de evidencia 'sin' como url null", async () => {
    await getAllAbsencesService(1, 6, { evidence: "sin" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ url: null }),
    );
  });

  it("incluye filtro startFrom como gte", async () => {
    await getAllAbsencesService(1, 6, { startFrom: "2026-01-01" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ start: { gte: new Date("2026-01-01") } }),
    );
  });

  it("incluye filtro endTo como lte", async () => {
    await getAllAbsencesService(1, 6, { endTo: "2026-12-31" });
    expect(getAllAbsencesModel).toHaveBeenCalledWith(
      1, 6,
      expect.objectContaining({ end: { lte: new Date("2026-12-31") } }),
    );
  });

  it("no agrega employee al where si no vienen filtros de empleado", async () => {
    await getAllAbsencesService(1, 6, { evidence: "con" });
    const call = getAllAbsencesModel.mock.calls[0][2];
    expect(call.employee).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Robustez ante errores del modelo
// ══════════════════════════════════════════════════════════════════════════════

describe("getAllAbsences — errores del modelo", () => {
  it("retorna tipo de error interno si el modelo devuelve success:false", async () => {
    getAllAbsencesModel.mockResolvedValue({ success: false });
    const r = await getAllAbsencesService(1, 6);
    expect(r.success).toBe(false);
  });

  it("retorna tipo de error interno si el modelo devuelve null", async () => {
    getAllAbsencesModel.mockResolvedValue(null);
    const r = await getAllAbsencesService(1, 6);
    expect(r.success).toBe(false);
  });

  it("retorna error interno si el modelo lanza excepción", async () => {
    getAllAbsencesModel.mockRejectedValue(new Error("DB exploded"));
    const r = await getAllAbsencesService(1, 6);
    expect(r.success).toBe(false);
  });
});