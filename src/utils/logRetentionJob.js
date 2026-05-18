const cron = require("node-cron");
const {
    deleteExpiredLogs,
    LOG_RETENTION_YEARS,
} = require("./logRetention");

const DEFAULT_CRON_EXPRESSION = "0 1 * * *";

exports.startLogRetentionJob = ({
    cronExpression = DEFAULT_CRON_EXPRESSION,
    retentionYears = LOG_RETENTION_YEARS,
    logger = console,
} = {}) => {
    return cron.schedule(cronExpression, async () => {
        try {
            const result = await deleteExpiredLogs({ retentionYears });
            logger.info?.(
                `[log-retention] deleted=${result.count} cutoff=${result.cutoffDate.toISOString()}`,
            );
        } catch (error) {
            logger.error?.("[log-retention] cleanup failed", error);
        }
    });
};
