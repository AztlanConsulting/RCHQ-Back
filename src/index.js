const express = require("express");
const speakeasy = require("speakeasy");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const app = express();

// Loads the variables in the enviorment file before creating Prisma.
require("dotenv").config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const errorHandler = require("./middleware/ErrorHandler");

const port = Number(process.env.RUNNING_PORT || 3000);

app.use(express.json());

//const xd = require("./utils/mail");


const userRouter = require("./router/user.route");
app.use("/users", userRouter);

app.use(errorHandler);

app.get("/test", async (req, res) => {
  const user = { texto: "Manuel" };
  try {
    const sent = await prisma.usuario.create({
      data: user,
    });
    res.json(sent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
