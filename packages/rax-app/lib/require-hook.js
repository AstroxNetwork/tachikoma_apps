"use strict";
// inspired by https://github.com/vercel/next.js/blob/canary/packages/next/build/webpack/require-hook.ts
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hijackWebpack = exports.getHookFiles = exports.getFileName = void 0;
// sync injects a hook for webpack and webpack/... requires to use the internal ncc webpack version
// this is in order for userland plugins to attach to the same webpack instance as next.js
// the individual compiled modules are as defined for the compilation in bundles/webpack/packages/*
function getFileName(filePath) {
    return filePath.split('/').slice(-1)[0];
}
exports.getFileName = getFileName;
function getHookFiles(webpack5) {
    var webpackPlugins = [
        'webpack/lib/Compilation',
        'webpack/lib/dependencies/ConstDependency',
        'webpack/lib/javascript/JavascriptParserHelpers',
        'webpack/lib/LibraryTemplatePlugin',
        'webpack/lib/LoaderTargetPlugin',
        'webpack/lib/node/NodeTargetPlugin',
        'webpack/lib/node/NodeTemplatePlugin',
        'webpack/lib/NormalModule',
        'webpack/lib/RequestShortener',
        'webpack/lib/RuntimeGlobals',
        'webpack/lib/RuntimeModule',
        'webpack/lib/optimize/LimitChunkCountPlugin',
        'webpack/lib/ParserHelpers',
        'webpack/lib/SingleEntryPlugin',
        'webpack/lib/Template',
        'webpack/lib/webworker/WebWorkerTemplatePlugin',
        'webpack/lib/node/NodeEnvironmentPlugin',
        'webpack/lib/BasicEvaluatedExpression',
        'webpack/lib/ModuleFilenameHelpers',
        'webpack/lib/GraphHelpers',
        'webpack/lib/ExternalsPlugin',
        'webpack/lib/web/FetchCompileAsyncWasmPlugin',
        'webpack/lib/web/FetchCompileWasmPlugin',
        'webpack/lib/ProgressPlugin',
    ];
    var pluginMap = webpackPlugins.map(function (pluginPath) {
        var pluginName = getFileName(pluginPath);
        return [pluginPath, "@builder/pack/deps/webpack/".concat(pluginName)];
    });
    var hookFiles = __spreadArray([
        ['webpack', '@builder/pack/deps/webpack/webpack-lib'],
        ['webpack/package', '@builder/pack/deps/webpack/package'],
        ['webpack/package.json', '@builder/pack/deps/webpack/package'],
        ['webpack/lib/webpack', '@builder/pack/deps/webpack/webpack-lib'],
        ['webpack/lib/webpack.js', '@builder/pack/deps/webpack/webpack-lib'],
        ['webpack-sources', '@builder/pack/deps/webpack/sources'],
        ['webpack-sources/lib', '@builder/pack/deps/webpack/sources'],
        ['webpack-sources/lib/index', '@builder/pack/deps/webpack/sources'],
        ['webpack-sources/lib/index.js', '@builder/pack/deps/webpack/sources'],
        ['webpack/hot/dev-server', '@builder/pack/deps/webpack/hot/dev-server'],
        ['webpack/hot/only-dev-server', '@builder/pack/deps/webpack/hot/only-dev-server'],
        ['webpack/hot/emitter', '@builder/pack/deps/webpack/hot/emitter']
    ], pluginMap, true);
    if (!webpack5) {
        hookFiles.push(['webpack-dev-server', '@builder/webpack-dev-server']);
        hookFiles.push(['@builder/pack/deps/terser-webpack-plugin', 'terser-webpack-plugin']);
    }
    else {
        hookFiles.push(['webpack-dev-server', '@builder/pack/deps/webpack-dev-server']);
    }
    return hookFiles;
}
exports.getHookFiles = getHookFiles;
function hijackWebpack(webpack5) {
    var hookPropertyMap = new Map(getHookFiles(webpack5).map(function (_a) {
        var request = _a[0], replacement = _a[1];
        return [request, require.resolve(replacement)];
    }));
    // eslint-disable-next-line global-require
    var mod = require('module');
    var resolveFilename = mod._resolveFilename;
    mod._resolveFilename = function (request, parent, isMain, options) {
        var hookResolved = hookPropertyMap.get(request);
        if (hookResolved)
            request = hookResolved;
        return resolveFilename.call(mod, request, parent, isMain, options);
    };
}
exports.hijackWebpack = hijackWebpack;
//# sourceMappingURL=require-hook.js.map