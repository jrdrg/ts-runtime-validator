module.exports = {
  globals: {
    "ts-jest": {
      "compiler": "ttypescript"
    }
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/node_modules/", "/__fixtures__/", "dist"]
};
