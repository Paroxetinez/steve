const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname),
  roots: ["<rootDir>/apps/web/src", "<rootDir>/packages/backend/convex"],
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "babel-jest",
      {
        presets: ["next/babel"],
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/apps/web/src/$1",
    "^@packages/backend/(.*)$": "<rootDir>/packages/backend/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};
