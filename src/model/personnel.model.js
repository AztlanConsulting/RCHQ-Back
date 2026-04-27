const prisma = require("../prisma");

function mapEmployee(employee) {
  if (!employee) return undefined;

  return {
    employeeId: employee.employee_id,
    email: employee.email,
    pwd: employee.password,
    name: employee.name,
    surname: employee.surname,
    role: employee.role?.name,
    roleId: employee.role_id,
    isActive: employee.is_active,
    hasFirstLogin: employee.has_first_login,
    isActive2FA: employee.is_active_2fa,
    totpSecret: employee.totp_secret,
    curp: employee.curp,
    birthDate: employee.birth_date,
    picture: employee.picture,
    startDate: employee.start_date,
    endDate: employee.end_date,
    phoneNumber: employee.phone_number,
    nss: employee.nss,
    bankAccount: employee.bank_account,
    failedLoginAttempts: employee.failed_login_attempts,
    failed2faAttempts: employee.failed_2fa_attempts,
    blockedUntil: employee.blocked_until,
    twoFaBlockedUntil: employee.two_fa_blocked_until,
    tempTotpSecret: employee.temp_totp_secret,
    tempTotpSecretCreatedAt: employee.temp_totp_secret_created_at,
  };
}

function mapHouse(house) {
  if (!house) return undefined;

  return {
    houseId: house.house_id,
    name: house.name,
    location: house.location,
    phoneNumber: house.phone_number,
    description: house.description,
    image: house.image,
  };
}

async function findEmployeeByEmail(email) {
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
}

async function getEmployeeById(employeeId) {
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
}

async function getHouseByEmployeeId(employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { employee_id: employeeId },
    select: { house_id: true },
  });
  if (!employee) return undefined;

  const house = await prisma.house.findUnique({
    where: { house_id: employee.house_id },
  });
  return mapHouse(house);
}

// return information about the employee's schedule,
// vacations, faults, and other cyclic employee data
// aggregate data from:
// employee_faults -> faults
// employee_address
// employee_workday
// employee_vacation_requests
async function getAdminEmployeeInfoById(employeeId) {
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
      employee_address: {
        select: {
          employee_address_id: true,
          url: true,
          street: true,
          municipio: true,
          city: true,
          postal_code: true,
          date: true,
        },
        orderBy: { date: "desc" },
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
    addresses: employee.employee_address.map((a) => ({
      employeeAddressId: a.employee_address_id,
      url: a.url,
      street: a.street,
      municipio: a.municipio,
      city: a.city,
      postalCode: a.postal_code,
      date: a.date,
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
}

// return urls and other metadata of the employee's record:
// employee_documents -> collections of urls to important employee docs
// employee_inside_certification
// employee_outside_certification
// employee_psychological_evaluation
async function getEmployeeRecord(employeeId) {
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
        stateCriminalRecordCertificate: d.documents.state_criminal_record_certificate,
        federalCriminalRecordCertificate: d.documents.federal_criminal_record_certificate,
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
}

module.exports = {
  findEmployeeByEmail,
  getEmployeeById,
  getHouseByEmployeeId,
  getAdminEmployeeInfoById,
  getEmployeeRecord
};
