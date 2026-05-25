const fs = require("fs");
const path = require("path");
const prisma = require("../../prisma");
const { seedActions } = require("./seedActions");

let schemaEnsured = false;
const UPLOADS_DIRS = [
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "uploads/documents"),
];
let initialUploadFiles = null;

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

const cleanGeneratedFiles = () => {
    const collectFilesRecursively = (dirPath, files = new Set()) => {
        if (!fs.existsSync(dirPath)) {
            return files;
        }

        for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                collectFilesRecursively(entryPath, files);
                continue;
            }

            files.add(entryPath);
        }

        return files;
    };

    if (initialUploadFiles === null) {
        initialUploadFiles = new Set();

        for (const dirPath of UPLOADS_DIRS) {
            collectFilesRecursively(dirPath, initialUploadFiles);
        }

        return;
    }

    const currentFiles = new Set();

    for (const dirPath of UPLOADS_DIRS) {
        collectFilesRecursively(dirPath, currentFiles);
    }

    for (const filePath of currentFiles) {
        if (!initialUploadFiles.has(filePath) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

const cleanIntegrationDb = async () => {
    await ensureIntegrationSchema();
    cleanGeneratedFiles();

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
