require("dotenv").config({ path: ".env.test" });

beforeEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    const prismaPath = require.resolve("./src/prisma");

    if (require.cache[prismaPath]) {
        const prisma = require("./src/prisma");

        await prisma.$disconnect();
    }
});
