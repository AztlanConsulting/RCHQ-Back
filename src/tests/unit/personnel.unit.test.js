const { getEmployeeDetail } = require("../../service/employee/get.service");
const EmployeeModel = require("../../model/employee/get.model");
const AbsenceModel = require("../../model/absence/get.model");
const HouseModel = require("../../model/house/get.model");
const RESPONSES = require("../../utils/responses");

jest.mock("../../utils/password", () => ({
    decryptValue: jest.fn(() => "12000"),
}));

jest.mock("../../model/employee/get.model", () => ({
    getEmployeeById: jest.fn(),
    getEmployeeAddress: jest.fn(),
    getEmployeeShifts: jest.fn(),
    getEmployeeVacationRequests: jest.fn(),
    getEmployeeShiftsRaw: jest.fn(),
}));

jest.mock("../../model/absence/get.model", () => ({
    getEmployeeJustifiedAbsenceRecordsInRange: jest.fn(),
}));

jest.mock("../../model/house/get.model", () => ({
    getHouseById: jest.fn(),
}));

const mockEmployee = {
    employeeId: "abc-123",
    houseId: "house-1",
    email: "test@gmail.com",
    name: "Test User",
    role: "Administrador",
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

const mockShifts = [
    {
        shiftId: "shift-1",
        startWorkdayId: "wd-1",
        endWorkdayId: "wd-1",
        startWorkdayName: "L-V",
        endWorkdayName: "L-V",
        start: "09:00",
        end: "18:00",
        allDay: false,
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
    EmployeeModel.getEmployeeShiftsRaw.mockResolvedValue([]);
    AbsenceModel.getEmployeeJustifiedAbsenceRecordsInRange.mockResolvedValue(
        [],
    );
});

describe("getEmployeeDetail", () => {
    it("retorna NOT_FOUND cuando empleado no existe", async () => {
        EmployeeModel.getEmployeeById.mockResolvedValue(null);

        const result = await getEmployeeDetail("viewer-user-id", "missing-id");

        expect(result.code).toBe(RESPONSES.EMPLOYEE.NOT_FOUND);
        expect(EmployeeModel.getEmployeeAddress).not.toHaveBeenCalled();
        expect(EmployeeModel.getEmployeeShifts).not.toHaveBeenCalled();
        expect(
            EmployeeModel.getEmployeeVacationRequests,
        ).not.toHaveBeenCalled();
        expect(HouseModel.getHouseById).not.toHaveBeenCalled();
    });

    it("retorna FOUND con basicInfo y adminInfo", async () => {
        EmployeeModel.getEmployeeById.mockResolvedValue({ ...mockEmployee });
        EmployeeModel.getEmployeeAddress.mockResolvedValue(mockAddress);
        HouseModel.getHouseById.mockResolvedValue(mockHouse);
        EmployeeModel.getEmployeeShifts.mockResolvedValue(mockShifts);
        EmployeeModel.getEmployeeVacationRequests.mockResolvedValue(
            mockVacationRequests,
        );

        const result = await getEmployeeDetail("admin-viewer", "abc-123");

        expect(result.code).toBe(RESPONSES.EMPLOYEE.FOUND);

        const { basicInfo, adminInfo } = result.data.employee;
        expect(basicInfo.employee).toMatchObject({ email: "test@gmail.com" });
        expect(basicInfo.address).toEqual(mockAddress);
        expect(basicInfo.house).toEqual(mockHouse);
        expect(adminInfo.shifts).toEqual(mockShifts);
        expect(adminInfo.vacationRequests).toEqual(mockVacationRequests);
        expect(adminInfo.absenceUsedDays).toBe(0);

        expect(EmployeeModel.getEmployeeById).toHaveBeenCalledWith("abc-123");
        expect(EmployeeModel.getEmployeeAddress).toHaveBeenCalledWith(
            "abc-123",
        );
        expect(HouseModel.getHouseById).toHaveBeenCalledWith(
            mockEmployee.houseId,
        );
        expect(EmployeeModel.getEmployeeShifts).toHaveBeenCalledWith(
            "abc-123",
        );
        expect(EmployeeModel.getEmployeeVacationRequests).toHaveBeenCalledWith(
            "abc-123",
        );
        expect(AbsenceModel.getEmployeeJustifiedAbsenceRecordsInRange)
            .toHaveBeenCalledTimes(1);
    });
});
