const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/**", "server/dist/**", "server/node_modules/**", "node_modules/**"]
  }
];
