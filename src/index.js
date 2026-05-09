require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const authRouter = require("./router/auth.route");
const employeeRouter = require("./router/employee.route");
const vacationRouter = require("./router/vacation.route");
const eventRouter = require("./router/event.route");
const absencesRouter = require("./router/absence.route");


const userRouter = require("./router/user.route");

const errorHandler = require("./middleware/ErrorHandler");
const path = require("path");

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
app.use("/employee", employeeRouter);
app.use("/user", userRouter);
app.use("/vacation", vacationRouter);
app.use("/event", eventRouter);
app.use("/absence", absencesRouter);

app.use("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "App funcionando correctamente",
    });
});

app.use(errorHandler);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
