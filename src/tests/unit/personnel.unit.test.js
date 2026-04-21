const { getEmployeeDetail } = require("../../service/personnel.service");
const { LOG_ACTIONS } = require("../../utils/logActions");

jest.mock("../../model/personnel.model", () => ({
  getEmployeeById: jest.fn(),
  getAdminEmployeeInfoById: jest.fn(),
  getEmployeeRecord: jest.fn(),
}));
jest.mock("../../model/log.model");
jest.mock("../../utils/ip");

const Personnel = require("../../model/personnel.model");
const { createLog } = require("../../model/log.model");
const { getClientIp } = require("../../utils/ip");

const mockEmployee = {
  employeeId: "abc-123",
  email: "test@gmail.com",
  name: "Test User",
  role: "admin",
  isActive: true,
  isActive2FA: false,
  blockedUntil: null,
  twoFaBlockedUntil: null,
  pwd: "hashedPassword",
  totpSecret: null,
  tempTotpSecret: null,
  tempTotpSecretCreatedAt: null,
};

const mockEmployeeAdminInfo = {
  faults: [
    {
      faultId: "fault-1",
      date: new Date("2025-01-10"),
      description: "Late arrival",
    },
  ],
  addresses: [
    {
      employeeAddressId: "addr-1",
      url: "https://example.com/proof-of-address.pdf",
      date: new Date("2025-02-01T12:00:00Z"),
    },
  ],
  workdays: [
    {
      workdayId: "wd-1",
      name: "L-V",
      start: new Date("1970-01-01T09:00:00.000Z"),
      end: new Date("1970-01-01T18:00:00.000Z"),
    },
  ],
  vacationRequests: [
    {
      vacationsRequestId: "vac-1",
      start: new Date("2025-07-01"),
      end: new Date("2025-07-14"),
      status: 1,
      feedback: null,
    },
  ],
};

const mockEmployeeRecord = {
  documents: [
    {
      documentId: "doc-1",
      url: "https://example.com/employee-docs-bundle",
      files: {
        cv: "cv.pdf",
        birthCertificate: null,
        taxStatusCertificate: "tax.pdf",
        addressCertificate: null,
        nss: null,
        professionalId: null,
        educationCertificate: null,
        medicalCertificate: null,
        stateCriminalRecordCertificate: null,
        federalCriminalRecordCertificate: null,
        firstRecommendationLetter: null,
        secondRecommendationLetter: null,
        driverLicense: null,
        signedRegulation: null,
        signedContract: null,
        signedConfidentialLetter: null,
        signedEthicsLetter: null,
        inductionManual: null,
      },
    },
  ],
  insideCertifications: [
    {
      insideCertificationId: "in-1",
      name: "Safety",
      description: "Internal safety course",
      date: new Date("2024-06-01"),
    },
  ],
  outsideCertifications: [
    {
      outsideCertificationId: "out-1",
      name: "First aid",
      file: "first-aid.pdf",
    },
  ],
  psychologicalEvaluations: [
    {
      psychologicalEvaluationId: "psy-1",
      file: "eval-2024.pdf",
      date: new Date("2024-01-15"),
    },
  ],
};

const makeReq = (body = {}, user = { userID: "viewer-user-id" }) => ({
  body,
  ip: "127.0.0.1",
  headers: {},
  socket: { remoteAddress: "127.0.0.1" },
  user,
});

beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue("127.0.0.1");
  createLog.mockResolvedValue();
});

describe("getEmployeeDetail", () => {
  it("returns 400 when employeeID is missing", async () => {
    // Arrange

    // Act
    const result = await getEmployeeDetail(makeReq({}, { userID: "u1" }));

    // Assert
    expect(result.status).toBe(400);
    expect(result.body.code).toBe("Bad Request");
    expect(Personnel.getEmployeeById).not.toHaveBeenCalled();
  });

  it("returns 404 when employee does not exist", async () => {
    // Arrange
    Personnel.getEmployeeById.mockResolvedValue(null);

    // Act
    const result = await getEmployeeDetail(
      makeReq({ employeeID: "missing-id" }),
    );

    // Assert
    expect(result.status).toBe(404);
    expect(result.body.code).toBe("Not Found");
    expect(Personnel.getAdminEmployeeInfoById).not.toHaveBeenCalled();
    expect(Personnel.getEmployeeRecord).not.toHaveBeenCalled();
  });

  it("returns 200 with basicInfo, adminInfo, record and logs the read", async () => {
    Personnel.getEmployeeById.mockResolvedValue({ ...mockEmployee });
    Personnel.getAdminEmployeeInfoById.mockResolvedValue(mockEmployeeAdminInfo);
    Personnel.getEmployeeRecord.mockResolvedValue(mockEmployeeRecord);

    const result = await getEmployeeDetail(
      makeReq({ employeeID: "abc-123" }, { userID: "admin-viewer" }),
    );

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.employee.basicInfo).toEqual(mockEmployee);
    expect(result.body.data.employee.adminInfo).toEqual(mockEmployeeAdminInfo);
    expect(result.body.data.employee.record).toEqual(mockEmployeeRecord);

    expect(Personnel.getEmployeeById).toHaveBeenCalledWith("abc-123");
    expect(Personnel.getAdminEmployeeInfoById).toHaveBeenCalledWith("abc-123");
    expect(Personnel.getEmployeeRecord).toHaveBeenCalledWith("abc-123");

    expect(createLog).toHaveBeenCalledWith(
      "admin-viewer",
      LOG_ACTIONS.READ_EMPLOYEE_DETAIL,
      "127.0.0.1",
    );
  });
});
