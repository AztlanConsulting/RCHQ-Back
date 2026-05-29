const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const cleanDatabase = async () => {
    await prisma.log.deleteMany();
    await prisma.employee.deleteMany();
};

const disconnectDatabase = async () => {
    await prisma.$disconnect();
};

module.exports = { prisma, cleanDatabase, disconnectDatabase };
