// tests/backend/profile.controller.test.js
const {
    getUserProfile: controllerFn,
} = require("../../controller/user/profile.controller");

jest.mock("../../service/user/profile.service");
const profileService = require("../../service/user/profile.service");
const RESPONSES = require("../../utils/responses");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const MOCK_EMPLOYEE_DATA = {
    houseName: "Casa Hogar Querétaro",
    roleName: "Coordinador",
    name: "Juan",
    surname: "Pérez",
    email: "juan@casa.org",
    rfc: "PEGJ900101XXX",
    curp: "PEGJ900101HQRRZN01",
    nss: "12345678901",
    bankAccount: "012345678901234567",
    birthDate: new Date("1990-01-01"),
    picture: null,
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("profile.controller — getUserProfile", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { user: { id: "uuid-empleado-001" } };
        res = buildRes();
    });

    describe("Flujo exitoso — 200", () => {
        it("responde 200 con data cuando el service retorna PROFILE.FOUND", async () => {
            profileService.getUserProfile.mockResolvedValue({
                code: RESPONSES.PROFILE.FOUND,
                data: MOCK_EMPLOYEE_DATA,
            });

            await controllerFn(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Perfil encontrado",
                data: MOCK_EMPLOYEE_DATA,
            });
        });

        it("pasa el employeeId correcto al service", async () => {
            profileService.getUserProfile.mockResolvedValue({
                code: RESPONSES.PROFILE.FOUND,
                data: MOCK_EMPLOYEE_DATA,
            });

            await controllerFn(req, res);

            expect(profileService.getUserProfile).toHaveBeenCalledWith(
                "uuid-empleado-001",
            );
        });
    });

    describe("Flujo - perfil no encontrado — 404", () => {
        it("responde 404 cuando el service retorna PROFILE.NOT_FOUND", async () => {
            profileService.getUserProfile.mockResolvedValue({
                code: RESPONSES.PROFILE.NOT_FOUND,
            });

            await controllerFn(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Perfil no encontrado",
            });
        });

        it("no incluye data en la respuesta 404", async () => {
            profileService.getUserProfile.mockResolvedValue({
                code: RESPONSES.PROFILE.NOT_FOUND,
            });

            await controllerFn(req, res);

            const jsonArg = res.json.mock.calls[0][0];
            expect(jsonArg).not.toHaveProperty("data");
        });
    });

    describe("Flujo - error inesperado — 500", () => {
        it("responde 500 cuando el service lanza una excepción", async () => {
            profileService.getUserProfile.mockRejectedValue(
                new Error("Unexpected"),
            );

            await controllerFn(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "Error al obtener el perfil del usuario",
            });
        });

        it("no propaga el error al caller (catch interno)", async () => {
            profileService.getUserProfile.mockRejectedValue(new Error("boom"));

            await expect(controllerFn(req, res)).resolves.not.toThrow();
        });
    });
});
