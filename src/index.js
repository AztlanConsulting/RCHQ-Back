require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouter = require("./router/auth.route");
const employeeRouter = require("./router/employee.route");
const vacationRouter = require("./router/vacation.route");
const eventRouter = require("./router/event.route");
const houseRouter = require("./router/house.route");
const blacklistRouter = require("./router/blacklist.route");
const absenceRouter = require("./router/absence.route");
const logsRouter = require("./router/logs.route");
const { startLogRetentionJob } = require("./utils/logRetentionJob");

const userRouter = require("./router/user.route");

const errorHandler = require("./middleware/ErrorHandler");
const path = require("path");

const port = Number(process.env.RUNNING_PORT || 3000);

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(origin => origin);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
}));

app.use("/auth", authRouter);
app.use("/employee", employeeRouter);
app.use("/user", userRouter);
app.use("/vacation", vacationRouter);
app.use("/event", eventRouter);
app.use("/house", houseRouter);
app.use("/blacklist", blacklistRouter);
app.use("/absence", absenceRouter);
app.use("/logs", logsRouter);

app.use("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "App funcionando correctamente",
    });
});

app.use(errorHandler);

if (require.main === module) {
    app.listen(port, () => {
        startLogRetentionJob();
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
