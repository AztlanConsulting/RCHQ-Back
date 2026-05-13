jest.mock("../../model/house/get.model", () => ({
    getHouseEmployeesByEmployeeId: jest.fn(),
    getHouseNameByEmployeeId: jest.fn(),
}));

const {
    getHouseEmployeesForEmployee,
} = require("../../service/house/get.service");
const {
    getHouseEmployeesByEmployeeId,
} = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");

describe("house.get.service — getHouseEmployeesForEmployee", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retorna NOT_PROVIDED si no recibe employeeId", async () => {
        const result = await getHouseEmployeesForEmployee();

        expect(result).toEqual({
            code: RESPONSES.EMPLOYEE.NOT_PROVIDED,
        });
    });

    it("retorna NOT_FOUND si el requester no existe o no tiene casa", async () => {
        getHouseEmployeesByEmployeeId.mockResolvedValue(null);

        const result = await getHouseEmployeesForEmployee("emp-1");

        expect(result).toEqual({
            code: RESPONSES.EMPLOYEE.NOT_FOUND,
        });
    });

    it("retorna empleados en camelCase", async () => {
        getHouseEmployeesByEmployeeId.mockResolvedValue([
            {
                employee_id: "emp-1",
                name: "Luis",
                surname: "Martínez",
                curp: "MALR900205HDFRRS09",
                is_active: true,
            },
            {
                employee_id: "emp-2",
                name: "María",
                surname: "González",
                curp: "GOMM900205MDFRRA01",
                is_active: false,
            },
        ]);

        const result = await getHouseEmployeesForEmployee("emp-1");

        expect(result).toEqual({
            code: RESPONSES.EMPLOYEE.FOUND,
            data: {
                employees: [
                    {
                        employeeId: "emp-1",
                        name: "Luis Martínez",
                        curp: "MALR900205HDFRRS09",
                        isActive: true,
                    },
                    {
                        employeeId: "emp-2",
                        name: "María González",
                        curp: "GOMM900205MDFRRA01",
                        isActive: false,
                    },
                ],
            },
        });
    });
});
