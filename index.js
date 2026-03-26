const express = require("express");
const app = express();

// Loads the variables in the enviorment file
require("dotenv").config();

const port = Number(process.env.RUNNING_PORT);

app.use(express.json());

const xd = require("./utils/mail");

const userRouter = require("./router/user.route");
app.use("/users", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
