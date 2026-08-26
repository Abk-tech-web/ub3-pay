const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

// Reduce file watcher load (Termux inotify limit workaround) - merged, single blockList
config.resolver.blockList = [
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/windows\/.*/,
  /node_modules\/.*\/macos\/.*/,
  /node_modules\/.*\/(test|tests|__tests__|__mocks__|__fixtures__|example|examples|docs|doc|benchmark|benchmarks|flow-typed|coverage|\.git|\.github|\.vscode|\.idea|\.yarn|\.cache)\/.*/,
];

module.exports = config;
