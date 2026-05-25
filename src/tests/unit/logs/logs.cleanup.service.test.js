jest.mock("../../../prisma", () => ({
    logs: {
        deleteMany: jest.fn(),
    },
}));

const prisma = require("../../../prisma");
const {
    LOG_RETENTION_YEARS,
    getRetentionCutoffDate,
    deleteExpiredLogs,
} = require("../../../utils/logRetention");

describe("logs.cleanup.util", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("calcula la fecha de corte a 5 años por defecto", () => {
        const baseDate = new Date("2026-05-17T12:00:00.000Z");

        const cutoffDate = getRetentionCutoffDate(baseDate);

        expect(cutoffDate.toISOString()).toBe("2021-05-17T12:00:00.000Z");
    });

    it("borra logs expirados usando la retención configurada", async () => {
        const now = new Date("2026-05-17T12:00:00.000Z");
        prisma.logs.deleteMany.mockResolvedValue({ count: 14 });

        const result = await deleteExpiredLogs({ now });

        expect(prisma.logs.deleteMany).toHaveBeenCalledWith({
            where: {
                moment: {
                    lt: new Date("2021-05-17T12:00:00.000Z"),
                },
                action: {
                    is: {
                        important: false,
                    },
                },
            },
        });
        expect(result).toEqual({
            count: 14,
            cutoffDate: new Date("2021-05-17T12:00:00.000Z"),
            retentionYears: LOG_RETENTION_YEARS,
        });
    });

    it("permite usar un periodo de retención distinto", async () => {
        const now = new Date("2026-05-17T12:00:00.000Z");
        prisma.logs.deleteMany.mockResolvedValue({ count: 3 });

        const result = await deleteExpiredLogs({
            now,
            retentionYears: 2,
        });

        expect(prisma.logs.deleteMany).toHaveBeenCalledWith({
            where: {
                moment: {
                    lt: new Date("2024-05-17T12:00:00.000Z"),
                },
                action: {
                    is: {
                        important: false,
                    },
                },
            },
        });
        expect(result.count).toBe(3);
        expect(result.retentionYears).toBe(2);
    });
});
