import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.node,
            },
            sourceType: "commonjs",
        },
        rules: {
            ...js.configs.recommended.rules,
        },
    },
    {
        files: ["**/*.test.js", "**/jest.setup.js"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },
    eslintConfigPrettier,
];
