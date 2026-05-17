const { readLogIp } = require("../logIp");

exports.extractAffectedEmployeeIds = (logs) => [
    ...new Set(
        logs
            .map((log) => log.affected)
            .filter((affected) => typeof affected === "string")
            .filter((affected) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    affected,
                ),
            ),
    ),
];

exports.buildAffectedEmployeeMap = (affectedEmployees) =>
    new Map(
        affectedEmployees.map((employee) => [
            employee.employee_id,
            `${employee.name} ${employee.surname}`.trim(),
        ]),
    );

exports.mapLog = (log, affectedEmployeeMap) => ({
    logId: log.log_id,
    responsibleEmployeeId: log.employee.employee_id,
    responsibleName: `${log.employee.name} ${log.employee.surname}`.trim(),
    responsibleCurp: log.employee.curp,
    responsiblePicture: log.employee.picture,
    affectedName: log.affected
        ? affectedEmployeeMap.get(log.affected) || log.affected
        : null,
    ipAddress: readLogIp(log.ip_address),
    action: log.action.description,
    important: log.action.important,
    moment: log.moment,
});
