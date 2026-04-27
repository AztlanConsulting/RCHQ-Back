const express = require("express");
const app = express();
const cors = require("cors");
const errorHandler = require("./middleware/ErrorHandler");
// Loads the variables in the enviorment file
require("dotenv").config();

const port = Number(process.env.RUNNING_PORT || 3000);

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

//const xd = require("./utils/mail");

const userRouter = require("./router/user.route");
const employeeRouter = require("./router/employee.route");

app.use("/users", userRouter);
app.use("/employee", employeeRouter);

app.use("/health", (req, res) => {
  res.status(200)
    .json({ 
      success: true, 
      message: "Aplicación bueno"
    })
})

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
