const prisma = require("../../prisma");
const { seedActions } = require("./seedActions");

let schemaEnsured = false;

const ensureIntegrationSchema = async () => {
    if (schemaEnsured) {
        return;
    }

    await prisma.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS public.blacklist
        ADD COLUMN IF NOT EXISTS reason VARCHAR(250)
    `);

    await prisma.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS public.employee
        ADD COLUMN IF NOT EXISTS deactivation_reason VARCHAR(250)
    `);

    schemaEnsured = true;
};

const cleanIntegrationDb = async () => {
    await ensureIntegrationSchema();

    const tables = await prisma.$queryRawUnsafe(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
    `);

    if (!tables.length) {
        return;
    }

    const identifiers = tables
        .map(({ tablename }) => `"public"."${tablename.replace(/"/g, "\"\"")}"`)
        .join(", ");

    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`
    );

    await seedActions(prisma);
};

module.exports = {
    cleanIntegrationDb,
};
