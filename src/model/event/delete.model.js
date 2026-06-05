const prisma = require("../../prisma");

exports.softDeleteHouseEvent = async (houseEventId) => {
    return await prisma.house_event.update({
        where: { house_event_id: houseEventId },
        data: { is_deleted: true },
    });
};

exports.softDeletePersonalEvent = async (personalEventId) => {
    return await prisma.personal_event.update({
        where: { personal_event_id: personalEventId },
        data: { is_deleted: true },
    });
};

exports.removeEmployeeFromPersonalEvent = async (personalEventId, employeeId) => {
    return await prisma.employee_personal_event.delete({
        where: {
            personal_event_id_employee_id: {
                personal_event_id: personalEventId,
                employee_id: employeeId,
            },
        },
    });
};
