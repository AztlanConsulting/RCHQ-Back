const { getUserProfile } = require("../../service/user/profile.service");

jest.mock("../../model/user/profile.model");
const profileModel = require("../../model/user/profile.model");
const RESPONSES = require("../../utils/responses");

const MOCK_PROFILE = {
    houseName: "Casa Hogar Querétaro",
    roleName: "Coordinador",
    name: "Juan",
    surname: "Pérez",
    email: "juan@casa.org",
    rfc: "PERJ900101ABC",
    curp: "PERJ900101HDFRZN01",
    nss: "12345678901",
    bankAccount: "012345678901234567",
    birthDate: new Date("1990-01-01"),
    picture: "https://cdn.example.com/foto.jpg",
};

describe("profile.service — getUserProfile", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("Flujo exitoso", () => {
        it("retorna code profile.found y los datos del perfil", async () => {
            profileModel.findEmployeeProfile.mockResolvedValue(MOCK_PROFILE);

            const result = await getUserProfile("uuid-empleado-001");

            expect(result.code).toBe(RESPONSES.PROFILE.FOUND);
            expect(result.data).toEqual(MOCK_PROFILE);
        });

        it("llama al model con el employeeId correcto", async () => {
            profileModel.findEmployeeProfile.mockResolvedValue(MOCK_PROFILE);

            await getUserProfile("otro-uuid");

            expect(profileModel.findEmployeeProfile).toHaveBeenCalledWith(
                "otro-uuid",
            );
        });
    });

    describe("Flujo - empleado no encontrado", () => {
        it("retorna code profile.notFound cuando el model devuelve null", async () => {
            profileModel.findEmployeeProfile.mockResolvedValue(null);

            const result = await getUserProfile("uuid-empleado-001");

            expect(result.code).toBe(RESPONSES.PROFILE.NOT_FOUND);
            expect(result).not.toHaveProperty("data");
        });
    });

    describe("Flujo - error del model", () => {
        it("propaga el error para que el controller lo capture", async () => {
            profileModel.findEmployeeProfile.mockRejectedValue(
                new Error("DB error"),
            );

            await expect(getUserProfile("uuid-empleado-001")).rejects.toThrow(
                "DB error",
            );
        });
    });
});
