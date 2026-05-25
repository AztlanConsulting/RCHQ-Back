const prisma = require("../../prisma");

const TRUNCATE_EXCLUDED_TABLES = new Set(["_prisma_migrations"]);

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;

const getPublicTables = async () => {
    const tables = await prisma.$queryRawUnsafe(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    `);

    return tables
        .map(({ tablename }) => tablename)
        .filter((tablename) => !TRUNCATE_EXCLUDED_TABLES.has(tablename));
};

const resetIntegrationDb = async () => {
    const tables = await getPublicTables();

    if (tables.length === 0) {
        return;
    }

    const truncateSql = `
        TRUNCATE TABLE ${tables.map(quoteIdentifier).join(", ")}
        RESTART IDENTITY CASCADE
    `;

    await prisma.$executeRawUnsafe(truncateSql);
};

const useIsolatedIntegrationDb = () => {
    beforeEach(async () => {
        await resetIntegrationDb();
    });

    afterEach(async () => {
        await resetIntegrationDb();
    });
};

module.exports = {
    resetIntegrationDb,
    useIsolatedIntegrationDb,
};
