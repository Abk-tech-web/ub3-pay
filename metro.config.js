const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');
config.resolver.blockList = [
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/windows\/.*/,
  /node_modules\/.*\/macos\/.*/,
];

module.exports = config;
