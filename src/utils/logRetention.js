const prisma = require("../prisma");

exports.LOG_RETENTION_YEARS = 5;

exports.getRetentionCutoffDate = (
    baseDate = new Date(),
    retentionYears = exports.LOG_RETENTION_YEARS,
) => {
    const cutoffDate = new Date(baseDate);
    cutoffDate.setUTCFullYear(cutoffDate.getUTCFullYear() - retentionYears);
    return cutoffDate;
};

exports.deleteExpiredLogs = async ({
    now = new Date(),
    retentionYears = exports.LOG_RETENTION_YEARS,
    db = prisma,
} = {}) => {
    const cutoffDate = exports.getRetentionCutoffDate(now, retentionYears);
    const { count } = await db.logs.deleteMany({
        where: {
            moment: {
                lt: cutoffDate,
            },
            action: {
                is: {
                    important: false,
                },
            },
        },
    });

    return {
        count,
        cutoffDate,
        retentionYears,
    };
};
