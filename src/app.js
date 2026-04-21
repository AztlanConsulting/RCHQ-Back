const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/ErrorHandler");
// Loads the variables in the enviorment file
require("dotenv").config();

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

const employeeRouter = require("./router/employee.route");
app.use("/employee", employeeRouter);

app.use(errorHandler);

module.exports = app;
