const { getWorkDays } = require("../../model/employee/consult.model");

exports.getWorkDays = async (employeeId) => {
    const rawWorkDays = await getWorkDays(employeeId);

    const workDays = [];
    rawWorkDays.forEach((day) => {
        workDays.push(day.workday.name);
    });
    return workDays;
}