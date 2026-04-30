const prisma = require("../../prisma");
const {
  mapEmployee,
  mapEmployeeAddress,
  mapHouse,
} = require("../../utils/mappers/personnel.map");

exports.findByCurp = async (curp) => {
  return await prisma.employee.findUnique({
    where: { curp },
  });
};

exports.findById = async (employee_id) => {
  return await prisma.employee.findUnique({
    where: { employee_id },
  });
};

exports.getAllRoles = async () => {
  const roles = await prisma.role.findMany();
  return roles.map((role) => ({
    roleId: role.role_id,
    name: role.name,
  }));
};

exports.getDocumentsByEmployee = async (employeeId) => {
  return await prisma.employee_documents.findMany({
    where: { employee_id: employeeId },
    include: { documents: true },
  });
};

exports.findDocumentRowByEmployee = async (employee_id) => {
  return await prisma.employee_documents.findFirst({
    where: { employee_id },
    include: { documents: true },
  });
};

exports.getEmployees = async (houseId, active, search, skip, take) => {
  const where = {
    house_id: houseId,
    is_active: active,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { surname: { contains: search, mode: "insensitive" } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: {
        employee_id: true,
        name: true,
        surname: true,
        picture: true,
        is_active: true,
        role: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    employees: employees.map((e) => ({
      employeeId: e.employee_id,
      name: e.name,
      surname: e.surname,
      picture: e.picture,
      isActive: e.is_active,
      roleName: e.role.name,
    })),
    total,
  };
};

exports.findEmployeeByEmail = async (email) => {
  const employee = await prisma.employee.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: "insensitive",
      },
    },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
};

exports.getEmployeeById = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    include: {
      role: {
        select: {
          name: true,
        },
      },
    },
  });
  return mapEmployee(employee);
};

exports.getEmployeeAddress = async (employeeId) => {
  const employeeAddress = await prisma.employee_address.findFirst({
    where: { employee_id: employeeId },
  });

  return mapEmployeeAddress(employeeAddress);
};

exports.getHouseByEmployeeId = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: { house_id: true },
  });
  if (!employee) return undefined;

  const house = await prisma.house.findUnique({
    where: { house_id: employee.house_id },
  });
  return mapHouse(house);
};

// return information about the employee's schedule,
// vacations, faults, and other cyclic employee data
// aggregate data from:
// employee_faults -> faults
// employee_workday
// employee_vacation_requests
exports.getAdminEmployeeInfoById = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: {
      employee_fault: {
        select: {
          fault: {
            select: {
              fault_id: true,
              date: true,
              description: true,
            },
          },
        },
      },
      employee_workday: {
        select: {
          start: true,
          end: true,
          workday: {
            select: {
              workday_id: true,
              name: true,
            },
          },
        },
      },
      vacations_request: {
        select: {
          vacations_request_id: true,
          start: true,
          end: true,
          status: true,
          feedback: true,
        },
        orderBy: { start: "desc" },
      },
    },
  });

  if (!employee) return undefined;

  return {
    faults: employee.employee_fault.map((ef) => ({
      faultId: ef.fault.fault_id,
      date: ef.fault.date,
      description: ef.fault.description,
    })),
    workdays: employee.employee_workday.map((w) => ({
      workdayId: w.workday.workday_id,
      name: w.workday.name,
      start: w.start,
      end: w.end,
    })),
    vacationRequests: employee.vacations_request.map((v) => ({
      vacationsRequestId: v.vacations_request_id,
      start: v.start,
      end: v.end,
      status: v.status,
      feedback: v.feedback,
    })),
  };
};

// return urls and other metadata of the employee's record:
// employee_documents -> collections of urls to important employee docs
// employee_inside_certification
// employee_outside_certification
// employee_psychological_evaluation
exports.getEmployeeRecord = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: {
      employee_documents: {
        select: {
          url: true,
          documents: true,
        },
      },
      employee_inside_certification: {
        select: {
          date: true,
          inside_certifications: {
            select: {
              inside_certification_id: true,
              name: true,
              description: true,
            },
          },
        },
      },
      outside_certification: {
        select: {
          outside_certification_id: true,
          file: true,
          name: true,
        },
      },
      psychological_evaluation: {
        select: {
          psychological_evaluation_id: true,
          file: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!employee) return undefined;

  return {
    documents: employee.employee_documents.map((d) => ({
      documentId: d.documents.document_id,
      url: d.url,
      files: {
        cv: d.documents.cv,
        birthCertificate: d.documents.birth_certificate,
        taxStatusCertificate: d.documents.tax_status_certificate,
        addressCertificate: d.documents.address_certificate,
        nss: d.documents.nss,
        professionalId: d.documents.professional_id,
        educationCertificate: d.documents.education_certificate,
        medicalCertificate: d.documents.medical_certificate,
        stateCriminalRecordCertificate:
          d.documents.state_criminal_record_certificate,
        federalCriminalRecordCertificate:
          d.documents.federal_criminal_record_certificate,
        firstRecommendationLetter: d.documents.first_recommendation_letter,
        secondRecommendationLetter: d.documents.second_recommendation_letter,
        driverLicense: d.documents.driver_license,
        signedRegulation: d.documents.signed_regulation,
        signedContract: d.documents.signed_contract,
        signedConfidentialLetter: d.documents.signed_confidential_letter,
        signedEthicsLetter: d.documents.signed_ethics_letter,
        inductionManual: d.documents.induction_manual,
      },
    })),
    insideCertifications: employee.employee_inside_certification.map((c) => ({
      insideCertificationId: c.inside_certifications.inside_certification_id,
      name: c.inside_certifications.name,
      description: c.inside_certifications.description,
      date: c.date,
    })),
    outsideCertifications: employee.outside_certification.map((c) => ({
      outsideCertificationId: c.outside_certification_id,
      name: c.name,
      file: c.file,
    })),
    psychologicalEvaluations: employee.psychological_evaluation.map((p) => ({
      psychologicalEvaluationId: p.psychological_evaluation_id,
      file: p.file,
      date: p.date,
    })),
  };
};