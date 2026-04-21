const express = require("express");
const app = express();
const cors = require("cors");
const { PrismaClient } = require('@prisma/client');
const { getClientIp } = require("./utils/ip");
const profileRouter = require("./router/profile.route");

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

app.use("/users", profileRouter);
app.use("/employee", employeeRouter);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
