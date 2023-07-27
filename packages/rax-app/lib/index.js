"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var miniappBuilderShared = require("miniapp-builder-shared");
var webpack_1 = require("@builder/pack/deps/webpack/webpack");
var require_hook_1 = require("./require-hook");
var _a = miniappBuilderShared.constants, MINIAPP = _a.MINIAPP, WECHAT_MINIPROGRAM = _a.WECHAT_MINIPROGRAM, BYTEDANCE_MICROAPP = _a.BYTEDANCE_MICROAPP, BAIDU_SMARTPROGRAM = _a.BAIDU_SMARTPROGRAM, KUAISHOU_MINIPROGRAM = _a.KUAISHOU_MINIPROGRAM;
var miniappPlatforms = [MINIAPP, WECHAT_MINIPROGRAM, BYTEDANCE_MICROAPP, BAIDU_SMARTPROGRAM, KUAISHOU_MINIPROGRAM];
var getBuiltInPlugins = function (userConfig) {
    var _a = userConfig.targets, targets = _a === void 0 ? ['web'] : _a, _b = userConfig.store, store = _b === void 0 ? true : _b, _c = userConfig.router, router = _c === void 0 ? true : _c, webpack5 = userConfig.webpack5, _d = userConfig.experiments, experiments = _d === void 0 ? {} : _d;
    var coreOptions = {
        framework: 'rax',
        alias: 'rax-app',
    };
    (0, webpack_1.init)(webpack5);
    (0, require_hook_1.hijackWebpack)(webpack5);
    // built-in plugins for rax app
    var builtInPlugins = [['build-plugin-app-core', coreOptions], 'build-plugin-rax-app', 'build-plugin-ice-config'];
    if (store) {
        builtInPlugins.push('build-plugin-rax-store');
    }
    if (targets.includes('web')) {
        builtInPlugins.push('build-plugin-rax-web');
    }
    if (targets.includes('weex')) {
        builtInPlugins.push('build-plugin-rax-weex');
    }
    if (targets.includes('kraken')) {
        builtInPlugins.push('build-plugin-rax-kraken');
    }
    var isMiniAppTargeted = targets.some(function (target) { return miniappPlatforms.includes(target); });
    if (isMiniAppTargeted) {
        builtInPlugins.push('build-plugin-rax-miniapp');
    }
    if (userConfig.web) {
        if (userConfig.web.pha) {
            builtInPlugins.push('build-plugin-rax-pha');
        }
        // Make ssr plugin after base plugin which need registerTask, the action will override the devServer config
        if (userConfig.web.ssr) {
            builtInPlugins.push('build-plugin-ssr');
        }
    }
    if (router) {
        builtInPlugins.push('build-plugin-rax-router');
    }
    builtInPlugins.push('build-plugin-ice-logger');
    if (experiments.minifyCSSModules === true) {
        builtInPlugins.push('build-plugin-minify-classname');
    }
    return builtInPlugins;
};
exports.default = getBuiltInPlugins;
//# sourceMappingURL=index.js.map