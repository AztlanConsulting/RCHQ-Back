const prisma = require("../../prisma");
const RESPONSES = require("../../utils/responses");
const {
    VACATION_STATUS,
    ACTIVE_VACATION_STATUSES,
} = require("../../utils/vacationStatus");
const { ROLES } = require("../../utils/roles");

const isAdminRole = (roleName) =>
    roleName?.toLowerCase() === ROLES.ADMIN.toLowerCase();

exports.approveVacationRequestAtomically = async ({
    vacationRequestId,
    employeeId,
    actorHouseId,
    usedDays,
    anniversaryStartDate,
    anniversaryEndDate,
    maxDays,
}) => {
    return await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw`
        SELECT employee_id
        FROM employee
        WHERE employee_id = ${employeeId}::uuid
        FOR UPDATE
    `;

        const vacationRequest = await transaction.vacations_request.findUnique({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        if (!vacationRequest) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            };
        }

        if (vacationRequest.employee_id !== employeeId) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        const targetEmployee = await transaction.employee.findUnique({
            where: {
                employee_id: employeeId,
            },
            include: {
                role: true,
            },
        });

        if (!targetEmployee) {
            return {
                success: false,
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            };
        }

        if (
            isAdminRole(targetEmployee.role?.name) ||
            targetEmployee.house_id !== actorHouseId
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        if (vacationRequest.status !== VACATION_STATUS.PENDING) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            };
        }

        if (
            vacationRequest.end > anniversaryEndDate ||
            vacationRequest.start < anniversaryStartDate
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.OUT_OF_RANGE,
            };
        }

        const requestStartDate = vacationRequest.start;
        const requestEndDate = vacationRequest.end;

        const overlappingApprovedVacation =
            await transaction.vacations_request.findFirst({
                where: {
                    employee_id: employeeId,
                    vacations_request_id: {
                        not: vacationRequestId,
                    },
                    status: VACATION_STATUS.APPROVED,
                    start: {
                        lte: requestEndDate,
                    },
                    end: {
                        gte: requestStartDate,
                    },
                },
            });

        if (overlappingApprovedVacation) {
            return {
                success: false,
                code: RESPONSES.VACATION.APPROVED_OVERLAP,
            };
        }

        const activeVacationsInCurrentYear =
            await transaction.vacations_request.findMany({
                where: {
                    employee_id: employeeId,
                    vacations_request_id: {
                        not: vacationRequestId,
                    },
                    status: {
                        in: ACTIVE_VACATION_STATUSES,
                    },
                    start: {
                        lte: anniversaryEndDate,
                    },
                    end: {
                        gte: anniversaryStartDate,
                    },
                },
                select: {
                    used_days: true,
                },
            });

        const activeUsedDays = activeVacationsInCurrentYear.reduce(
            (total, vacation) => total + vacation.used_days,
            0
        );

        if (activeUsedDays + usedDays > maxDays) {
            return {
                success: false,
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            };
        }

        const approvedVacation = await transaction.vacations_request.update({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                status: VACATION_STATUS.APPROVED,
                used_days: usedDays,
            },
        });

        return {
            success: true,
            data: {
                vacationRequest: approvedVacation,
            },
        };
    });
};

exports.rejectVacationRequestAtomically = async ({
    vacationRequestId,
    employeeId,
    actorHouseId,
    feedback,
}) => {
    return await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw`
            SELECT employee_id
            FROM employee
            WHERE employee_id = ${employeeId}::uuid
            FOR UPDATE
        `;

        const vacationRequest = await transaction.vacations_request.findUnique({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        if (!vacationRequest) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            };
        }

        if (vacationRequest.employee_id !== employeeId) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        const targetEmployee = await transaction.employee.findUnique({
            where: {
                employee_id: employeeId,
            },
            include: {
                role: true,
            },
        });

        if (!targetEmployee) {
            return {
                success: false,
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            };
        }

        if (
            isAdminRole(targetEmployee.role?.name) ||
            targetEmployee.house_id !== actorHouseId
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        if (vacationRequest.status !== VACATION_STATUS.PENDING) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_ALREADY_REVIEWED,
            };
        }

        const rejectedVacation = await transaction.vacations_request.update({
            where: {
                vacations_request_id: vacationRequestId,
            },
            data: {
                status: VACATION_STATUS.REJECTED,
                feedback: feedback || null,
            },
        });

        return {
            success: true,
            data: {
                vacationRequest: rejectedVacation,
            },
        };
    });
};

exports.updateVacationRequestDatesAtomically = async ({
    vacationRequestId,
    employeeId,
    actorHouseId,
    startDate,
    endDate,
    usedDays,
    anniversaryStartDate,
    anniversaryEndDate,
    maxDays,
}) => {
    return await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw`
            SELECT employee_id
            FROM employee
            WHERE employee_id = ${employeeId}::uuid
            FOR UPDATE
        `;

        const vacationRequest = await transaction.vacations_request.findUnique({
            where: {
                vacations_request_id: vacationRequestId,
            },
        });

        if (!vacationRequest) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_NOT_FOUND,
            };
        }

        if (vacationRequest.employee_id !== employeeId) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        const targetEmployee = await transaction.employee.findUnique({
            where: {
                employee_id: employeeId,
            },
            include: {
                role: true,
            },
        });

        if (!targetEmployee) {
            return {
                success: false,
                code: RESPONSES.EMPLOYEE.NOT_FOUND,
            };
        }

        if (
            isAdminRole(targetEmployee.role?.name) ||
            targetEmployee.house_id !== actorHouseId
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        if (
            vacationRequest.status !== VACATION_STATUS.PENDING &&
            vacationRequest.status !== VACATION_STATUS.APPROVED
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.REQUEST_NOT_MODIFIABLE,
            };
        }

        if (endDate > anniversaryEndDate || startDate < anniversaryStartDate) {
            return {
                success: false,
                code: RESPONSES.VACATION.OUT_OF_RANGE,
            };
        }

        const overlappingActiveVacation =
            await transaction.vacations_request.findFirst({
                where: {
                    employee_id: employeeId,
                    vacations_request_id: {
                        not: vacationRequestId,
                    },
                    status: {
                        in: ACTIVE_VACATION_STATUSES,
                    },
                    start: {
                        lte: endDate,
                    },
                    end: {
                        gte: startDate,
                    },
                },
            });

        if (overlappingActiveVacation) {
            return {
                success: false,
                code: RESPONSES.VACATION.ALREADY_REQUEST,
            };
        }

        const activeVacationsInCurrentYear =
            await transaction.vacations_request.findMany({
                where: {
                    employee_id: employeeId,
                    vacations_request_id: {
                        not: vacationRequestId,
                    },
                    status: {
                        in: ACTIVE_VACATION_STATUSES,
                    },
                    start: {
                        lte: anniversaryEndDate,
                    },
                    end: {
                        gte: anniversaryStartDate,
                    },
                },
                select: {
                    used_days: true,
                },
            });

        const activeUsedDays = activeVacationsInCurrentYear.reduce(
            (total, vacation) => total + vacation.used_days,
            0
        );

        if (activeUsedDays + usedDays > maxDays) {
            return {
                success: false,
                code: RESPONSES.VACATION.INSUFFICIENT_DATES,
            };
        }

        const updatedVacationRequest =
            await transaction.vacations_request.update({
                where: {
                    vacations_request_id: vacationRequestId,
                },
                data: {
                    start: startDate,
                    end: endDate,
                    used_days: usedDays,
                },
            });

        return {
            success: true,
            data: {
                vacationRequest: updatedVacationRequest,
            },
        };
    });
};
