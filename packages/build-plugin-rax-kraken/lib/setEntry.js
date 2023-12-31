const fs = require('fs-extra');
const path = require('path');

module.exports = (config, context) => {
  const {
    rootDir,
    userConfig: { kraken = {} },
  } = context;

  if (!kraken.mpa) {
    // SPA
    const appEntry = moduleResolve(formatPath(path.join(rootDir, './src/app')));
    const entryConfig = config.entry('index');

    entryConfig.add(appEntry);
  }
};

function moduleResolve(filePath) {
  const ext = ['.ts', '.js', '.tsx', '.jsx'].find(extension => fs.existsSync(`${filePath}${extension}`));
  if (!ext) {
    throw new Error(`Cannot find target file ${filePath}.`);
  }
  return require.resolve(`${filePath}${ext}`);
}

function formatPath(pathStr) {
  return process.platform === 'win32' ? pathStr.split(path.sep).join('/') : pathStr;
}
