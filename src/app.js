const express = require("express");
const app = express();
const cors = require("cors");
const authRouter = require("./router/auth.route");
const employeeRouter = require("./router/employee.route");
const userRouter = require("./router/user.route");
const vacationRouter = require("./router/vacation.route");
const eventRouter = require("./router/event.route");
const houseRouter = require("./router/house.route");
const absenceRouter = require("./router/absence.route");
const blacklistRouter = require("./router/blacklist.route");
const logsRouter = require("./router/logs.route");

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

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/employee", employeeRouter);
app.use("/vacation", vacationRouter);
app.use("/event", eventRouter);
app.use("/house", houseRouter);
app.use("/absence", absenceRouter);
app.use("/blacklist", blacklistRouter);
app.use("/logs", logsRouter);

app.use(errorHandler);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
