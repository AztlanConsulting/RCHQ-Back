jest.mock("../../../model/absence/get.model", () => ({
    getAllAbsenceTypes: jest.fn(),
}));

const { getAbsenceTypes } = require("../../../service/absence/get.service");
const { getAllAbsenceTypes } = require("../../../model/absence/get.model");
const RESPONSES = require("../../../utils/responses");

describe("absence.get.service — getAbsenceTypes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retorna NOT_FOUND si no hay tipos de ausencia", async () => {
        getAllAbsenceTypes.mockResolvedValue([]);

        const result = await getAbsenceTypes();

        expect(result).toEqual({
            code: RESPONSES.EVENTS.NOT_FOUND,
        });
    });

    it("retorna absenceTypes en camelCase", async () => {
        getAllAbsenceTypes.mockResolvedValue([
            {
                absence_type_id: "type-1",
                name: "Médica",
            },
            {
                absence_type_id: "type-2",
                name: "Paternidad",
            },
        ]);

        const result = await getAbsenceTypes();

        expect(result).toEqual({
            code: RESPONSES.EVENTS.FOUND,
            data: {
                absenceTypes: [
                    { absenceTypeId: "type-1", name: "Médica" },
                    { absenceTypeId: "type-2", name: "Paternidad" },
                ],
            },
        });
    });
});
