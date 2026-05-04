// tests/helpers/prismaTest.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL, // .env.test
        },
    },
});

const cleanDatabase = async () => {
    // Orden importante por foreign keys
    await prisma.log.deleteMany();
    await prisma.employee.deleteMany();
};

const disconnectDatabase = async () => {
    await prisma.$disconnect();
};

module.exports = { prisma, cleanDatabase, disconnectDatabase };
