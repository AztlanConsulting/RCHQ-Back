const prisma = require("../../prisma");
const RESPONSES = require("../../utils/responses");
const { ROLES } = require("../../utils/roles");

exports.deleteVacationRequestAtomically = async ({
    vacationRequestId,
    employeeId,
    actorHouseId,
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

        const targetRoleName = targetEmployee.role?.name;

        if (
            targetRoleName === ROLES.ADMIN ||
            targetEmployee.house_id !== actorHouseId
        ) {
            return {
                success: false,
                code: RESPONSES.VACATION.EMPLOYEE_OUT_OF_SCOPE,
            };
        }

        const deletedVacationRequest =
            await transaction.vacations_request.delete({
                where: {
                    vacations_request_id: vacationRequestId,
                },
            });

        return {
            success: true,
            data: {
                vacationRequest: deletedVacationRequest,
            },
        };
    });
};
