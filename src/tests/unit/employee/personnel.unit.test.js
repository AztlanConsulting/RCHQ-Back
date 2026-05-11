const { getEmployeeDetail } = require("../../../service/employee/get.service");
const EmployeeModel = require("../../../model/employee/get.model");
const HouseModel = require("../../../model/house/get.model");
const RESPONSES = require("../../../utils/responses");

jest.mock("../../../utils/password", () => ({
    decryptValue: jest.fn(() => "12000"),
}));

jest.mock("../../../model/employee/get.model", () => ({
    getEmployeeById: jest.fn(),
    getEmployeeAddress: jest.fn(),
    getEmployeeFaults: jest.fn(),
    getEmployeeWorkdays: jest.fn(),
    getEmployeeVacationRequests: jest.fn(),
}));

jest.mock("../../../model/house/get.model", () => ({
    getHouseById: jest.fn(),
}));

const mockEmployee = {
    employeeId: "abc-123",
    houseId: "house-1",
    email: "test@gmail.com",
    name: "Test User",
    role: "admin",
    type: "nomina",
    isActive: true,
    isActive2FA: false,
    blockedUntil: null,
    salary: "encryptedSalary",
};

const mockAddress = {
    employeeAddressId: "addr-1",
    street: "Calle 1",
    municipio: "Muni",
    city: "CDMX",
    postalCode: "01000",
    date: new Date("2024-04-01T12:00:00Z"),
};

const mockHouse = {
    houseId: "house-1",
    name: "Casa Hogar",
    location: "Querétaro",
};

const mockFaults = [
    {
        faultId: "fault-1",
        date: new Date("2025-01-10"),
        description: "Late arrival",
    },
];

const mockWorkdays = [
    {
        workdayId: "wd-1",
        name: "L-V",
        start: new Date("1970-01-01T09:00:00.000Z"),
        end: new Date("1970-01-01T18:00:00.000Z"),
    },
];

const mockVacationRequests = [
    {
        vacationsRequestId: "vac-1",
        start: new Date("2025-07-01"),
        end: new Date("2025-07-14"),
        status: 1,
        feedback: null,
    },
];

beforeEach(() => {
    jest.clearAllMocks();
});

describe("getEmployeeDetail", () => {
    it("retorna NOT_FOUND cuando empleado no existe", async () => {
        EmployeeModel.getEmployeeById.mockResolvedValue(null);

        const result = await getEmployeeDetail("viewer-user-id", "missing-id");

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        expect(EmployeeModel.getEmployeeAddress).not.toHaveBeenCalled();
        expect(EmployeeModel.getEmployeeFaults).not.toHaveBeenCalled();
        expect(EmployeeModel.getEmployeeWorkdays).not.toHaveBeenCalled();
        expect(
            EmployeeModel.getEmployeeVacationRequests,
        ).not.toHaveBeenCalled();
        expect(HouseModel.getHouseById).not.toHaveBeenCalled();
    });

    it("retorna FOUND con basicInfo y adminInfo", async () => {
        EmployeeModel.getEmployeeById.mockResolvedValue({ ...mockEmployee });
        EmployeeModel.getEmployeeAddress.mockResolvedValue(mockAddress);
        HouseModel.getHouseById.mockResolvedValue(mockHouse);
        EmployeeModel.getEmployeeFaults.mockResolvedValue(mockFaults);
        EmployeeModel.getEmployeeWorkdays.mockResolvedValue(mockWorkdays);
        EmployeeModel.getEmployeeVacationRequests.mockResolvedValue(
            mockVacationRequests,
        );

        const result = await getEmployeeDetail("admin-viewer", "abc-123");

        expect(result.code).toBe(RESPONSES.EMPLOYEE.FOUND);

        const { basicInfo, adminInfo } = result.data.employee;
        expect(basicInfo.employee).toMatchObject({ email: "test@gmail.com" });
        expect(basicInfo.address).toEqual(mockAddress);
        expect(basicInfo.house).toEqual(mockHouse);
        expect(adminInfo.faults).toEqual(mockFaults);
        expect(adminInfo.workdays).toEqual(mockWorkdays);
        expect(adminInfo.vacationRequests).toEqual(mockVacationRequests);

        expect(EmployeeModel.getEmployeeById).toHaveBeenCalledWith("abc-123");
        expect(EmployeeModel.getEmployeeAddress).toHaveBeenCalledWith(
            "abc-123",
        );
        expect(HouseModel.getHouseById).toHaveBeenCalledWith(
            mockEmployee.houseId,
        );
        expect(EmployeeModel.getEmployeeFaults).toHaveBeenCalledWith("abc-123");
        expect(EmployeeModel.getEmployeeWorkdays).toHaveBeenCalledWith(
            "abc-123",
        );
        expect(EmployeeModel.getEmployeeVacationRequests).toHaveBeenCalledWith(
            "abc-123",
        );
    });
});
