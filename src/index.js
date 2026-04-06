const express = require("express");
const app = express();

const errorHandler = require("./middleware/ErrorHandler");

// Loads the variables in the enviorment file
require("dotenv").config();

const port = Number(process.env.RUNNING_PORT || 3000);

app.use(express.json());

//const xd = require("./utils/mail");


const userRouter = require("./router/user.route");
app.use("/users", userRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
