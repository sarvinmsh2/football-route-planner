const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  transform: {
    ...tsJestTransformCfg,
  },

  // this is what was needed 
  testMatch: [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],

  // optional but helps in TS projects
  moduleFileExtensions: ["ts", "js", "json"],
};