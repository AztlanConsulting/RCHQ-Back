const { readLogIp } = require("../logIp");

const CST_OFFSET_MS = 6 * 60 * 60 * 1000;

const toCST = (dt) => {
    if (!dt) return null;
    return new Date(dt.getTime() - CST_OFFSET_MS);
};

exports.extractAffectedIds = (logs) => [
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

exports.buildAffectedEntityMap = (
    affectedEmployees = [],
    affectedHouses = [],
    affectedEvents = [],
) => (
    new Map([
        ...affectedEmployees.map((employee) => [
            employee.employee_id,
            `${employee.name} ${employee.surname}`.trim(),
        ]),
        ...affectedHouses.map((house) => [
            house.house_id,
            house.name,
        ]),
        ...affectedEvents.map((event) => [
            event.id,
            event.name,
        ]),
    ])
);

exports.mapLog = (log, affectedEntityMap) => ({
    logId: log.log_id,
    responsibleEmployeeId: log.employee.employee_id,
    responsibleName: `${log.employee.name} ${log.employee.surname}`.trim(),
    responsibleCurp: log.employee.curp,
    responsiblePicture: log.employee.picture,
    affectedName: log.affected
        ? affectedEntityMap.get(log.affected) || log.affected
        : null,
    ipAddress: readLogIp(log.ip_address),
    action: log.action.description,
    important: log.action.important,
    moment: toCST(log.moment),
});
