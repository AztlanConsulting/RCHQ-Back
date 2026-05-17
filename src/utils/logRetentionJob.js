const {
    deleteExpiredLogs,
    LOG_RETENTION_YEARS,
} = require("./logRetention");

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

exports.startLogRetentionJob = ({
    intervalMs = ONE_DAY_IN_MS,
    retentionYears = LOG_RETENTION_YEARS,
    logger = console,
} = {}) => {
    const runCleanup = async () => {
        try {
            const result = await deleteExpiredLogs({ retentionYears });
            logger.info?.(
                `[log-retention] deleted=${result.count} cutoff=${result.cutoffDate.toISOString()}`,
            );
        } catch (error) {
            logger.error?.("[log-retention] cleanup failed", error);
        }
    };

    void runCleanup();

    const timer = setInterval(() => {
        void runCleanup();
    }, intervalMs);

    if (typeof timer.unref === "function") {
        timer.unref();
    }

    return timer;
};
