const { VACATION_STATUS } = require("../vacationStatus");
const { getNaturalDays } = require("../vacationDateHelpers");

exports.getVacationStatusLabel = (status) => {
    if (status === VACATION_STATUS.APPROVED) return "Aprobada";
    if (status === VACATION_STATUS.REJECTED) return "Rechazada";
    if (status === VACATION_STATUS.PENDING) return "Pendiente";
    return "Desconocido";
};

exports.mapReviewedStatus = (status) => {
    if (status === "approved") return VACATION_STATUS.APPROVED;
    if (status === "rejected") return VACATION_STATUS.REJECTED;
    return "all";
};

exports.mapVacationEmployee = (employee) => {
    return {
        employeeId: employee.employee_id,
        fullName: [employee.name, employee.surname].filter(Boolean).join(" "),
        name: employee.name,
        surname: employee.surname,
        curp: employee.curp,
        picture: employee.picture,
        house: {
            houseId: employee.house.house_id,
            name: employee.house.name,
        },
    };
};

exports.mapVacationRequestForList = (request) => {
    const naturalDays = getNaturalDays(request.start, request.end);

    return {
        vacationRequestId: request.vacations_request_id,
        startDate: request.start,
        endDate: request.end,
        naturalDays,
        usedDays: request.used_days,
        status: request.status,
        statusLabel: exports.getVacationStatusLabel(request.status),
        feedback: request.feedback,
        createdAt: request.created_at,
        employee: exports.mapVacationEmployee(request.employee),
    };
};