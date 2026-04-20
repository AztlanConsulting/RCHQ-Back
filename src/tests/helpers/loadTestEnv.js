// tests/helpers/loadTestEnv.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test") });