module.exports = {
  testEnvironment: "node",

  verbose: true,

  collectCoverage: true,
  coverageDirectory: "coverage",

  testMatch: [
    "<rootDir>/src/tests/unit/**/*.test.js",
    "<rootDir>/src/tests/integration/**/*.test.js",
  ],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 15000,
};
