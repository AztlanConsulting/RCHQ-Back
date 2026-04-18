const express = require("express");
const app = express();
const cors = require("cors");
const { PrismaClient } = require('@prisma/client');
const { getClientIp } = require("./utils/ip");

const employeeRouter = require("./router/employee.route");

const prisma = new PrismaClient();

const errorHandler = require("./middleware/ErrorHandler");

const path = require("path");

// Loads the variables in the enviorment file
require("dotenv").config();

const port = Number(process.env.RUNNING_PORT || 3000);

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

//const xd = require("./utils/mail");

const userRouter = require("./router/user.route");
app.use("/users", userRouter);

app.use("/employee", employeeRouter);

app.use(errorHandler);

app.get("/test", async (req, res) => {
  const ip = getClientIp(req);
  try {
    const id = "b6d789e5-1916-4db4-90db-36b6d8776588"; // Valid UUID for testing
    const users = await prisma.employee.findMany();
    // await logFunction(id, new Date(), "Fetched all users", ip);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
    
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
