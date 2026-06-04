jest.mock("../../model/beneficiary/get.model", () => ({
    searchBeneficiaryByCurp: jest.fn(),
    searchBeneficiaryByInfo: jest.fn(),
    findActiveCoordinatorByHouseId: jest.fn(),
}));

jest.mock("../../model/beneficiary/create.model", () => ({
    create: jest.fn(),
}));

jest.mock("../../model/house/get.model", () => ({
    getHouseById: jest.fn(),
}));

const {
    searchBeneficiaryByCurp,
    searchBeneficiaryByInfo,
    findActiveCoordinatorByHouseId,
} = require("../../model/beneficiary/get.model");
const { create: createBeneficiary } = require("../../model/beneficiary/create.model");
const { getHouseById } = require("../../model/house/get.model");
const { registerBeneficiaryService } = require("../../service/beneficiary/create.service");
const RESPONSES = require("../../utils/responses");

const HOUSE_A = "a0520001-0000-4000-8000-000000000001";
const HOUSE_B = "a0520001-0000-4000-8000-000000000002";
const EXISTING_BENEFICIARY_ID = "a0520001-0000-4000-8000-000000000010";

const mockCoordinator = {
    id: "coord-1",
    role: "Coordinador",
    houseId: HOUSE_A,
};

const baseBeneficiary = {
    name: "Juan Manuel",
    maternal_surname: "Lopez",
    paternal_surname: "Garcia",
    preferred_name: "Juanito",
    birth_date: "2015-03-10",
    age_entered_house: 8,
    blood_type: "O+",
};

beforeEach(() => {
    jest.clearAllMocks();
    searchBeneficiaryByCurp.mockResolvedValue(null);
    searchBeneficiaryByInfo.mockResolvedValue(null);
    createBeneficiary.mockResolvedValue({
        beneficiaryId: "new-beneficiary-id",
        houseId: HOUSE_A,
    });
});

describe("registerBeneficiaryService", () => {
    it("registra beneficiario exitosamente sin CURP", async () => {
        const result = await registerBeneficiaryService(
            mockCoordinator,
            baseBeneficiary,
        );

        expect(result.code).toBe(RESPONSES.BENEFICIARY.ADDED);
        expect(result.data.beneficiaryId).toBe("new-beneficiary-id");
        expect(searchBeneficiaryByInfo).toHaveBeenCalledWith({
            name: "Juan Manuel",
            maternal_surname: "Lopez",
            paternal_surname: "Garcia",
            birth_date: "2015-03-10",
            blood_type: "O+",
        });
        expect(searchBeneficiaryByCurp).not.toHaveBeenCalled();
        expect(createBeneficiary).toHaveBeenCalledWith(
            expect.objectContaining({
                houseId: HOUSE_A,
                name: "Juan Manuel",
                curp: null,
                last_record_update: null,
            }),
        );
    });

    it("registra beneficiario exitosamente con CURP", async () => {
        const payload = {
            ...baseBeneficiary,
            curp: "galm150310hdfrzn09",
        };

        const result = await registerBeneficiaryService(
            mockCoordinator,
            payload,
        );

        expect(result.code).toBe(RESPONSES.BENEFICIARY.ADDED);
        expect(searchBeneficiaryByCurp).toHaveBeenCalledWith("GALM150310HDFRZN09");
        expect(searchBeneficiaryByInfo).not.toHaveBeenCalled();
        expect(createBeneficiary).toHaveBeenCalledWith(
            expect.objectContaining({
                curp: "GALM150310HDFRZN09",
            }),
        );
    });

    it("permite nombres compuestos con espacios", async () => {
        const result = await registerBeneficiaryService(mockCoordinator, {
            ...baseBeneficiary,
            name: "María José",
        });

        expect(result.code).toBe(RESPONSES.BENEFICIARY.ADDED);
    });

    it("retorna BAD_REQUEST si falta un campo obligatorio", async () => {
        const payload = { ...baseBeneficiary };
        delete payload.name;

        const result = await registerBeneficiaryService(
            mockCoordinator,
            payload,
        );

        expect(result.code).toBe(RESPONSES.BENEFICIARY.BAD_REQUEST);
        expect(createBeneficiary).not.toHaveBeenCalled();
    });

    it("retorna BAD_REQUEST si el tipo de sangre es inválido", async () => {
        const result = await registerBeneficiaryService(mockCoordinator, {
            ...baseBeneficiary,
            blood_type: "Z+",
        });

        expect(result.code).toBe(RESPONSES.BENEFICIARY.BAD_REQUEST);
        expect(createBeneficiary).not.toHaveBeenCalled();
    });

    it("retorna BAD_REQUEST si la fecha de nacimiento es futura", async () => {
        const result = await registerBeneficiaryService(mockCoordinator, {
            ...baseBeneficiary,
            birth_date: "2099-01-01",
        });

        expect(result.code).toBe(RESPONSES.BENEFICIARY.BAD_REQUEST);
        expect(createBeneficiary).not.toHaveBeenCalled();
    });

    it("retorna ALREADY_REGISTERED_IN_SAME_HOUSE si ya existe en la misma casa", async () => {
        searchBeneficiaryByInfo.mockResolvedValue({
            beneficiary_id: EXISTING_BENEFICIARY_ID,
            house_id: HOUSE_A,
        });

        const result = await registerBeneficiaryService(
            mockCoordinator,
            baseBeneficiary,
        );

        expect(result.code).toBe(
            RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_SAME_HOUSE,
        );
        expect(result.data).toEqual({
            beneficiaryId: EXISTING_BENEFICIARY_ID,
        });
        expect(createBeneficiary).not.toHaveBeenCalled();
    });

    it("retorna ALREADY_REGISTERED_IN_OTHER_HOUSE con datos de contacto", async () => {
        searchBeneficiaryByCurp.mockResolvedValue({
            beneficiary_id: EXISTING_BENEFICIARY_ID,
            house_id: HOUSE_B,
        });
        getHouseById.mockResolvedValue({
            houseId: HOUSE_B,
            name: "Casa Remota",
        });
        findActiveCoordinatorByHouseId.mockResolvedValue({
            name: "Ana",
            surname: "Coord",
            email: "ana.coord@test.com",
            phone_number: "4420000001",
        });

        const result = await registerBeneficiaryService(mockCoordinator, {
            ...baseBeneficiary,
            curp: "NADA150310HDFXXX09",
        });

        expect(result.code).toBe(
            RESPONSES.BENEFICIARY.ALREADY_REGISTERED_IN_OTHER_HOUSE,
        );
        expect(result.data).toEqual({
            house: { id: HOUSE_B, name: "Casa Remota" },
            coordinator: {
                name: "Ana Coord",
                phoneNumber: "4420000001",
                email: "ana.coord@test.com",
            },
        });
        expect(createBeneficiary).not.toHaveBeenCalled();
        expect(getHouseById).toHaveBeenCalledWith(HOUSE_B);
        expect(findActiveCoordinatorByHouseId).toHaveBeenCalledWith(HOUSE_B);
    });
});
