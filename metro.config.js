const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase Auth needs Metro to resolve the React Native entrypoint.
// With package exports enabled, Metro can pick the web build on Android.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
