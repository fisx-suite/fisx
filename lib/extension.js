/**
 * @file fis 扩展接口定义
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var util = require('util');

/**
 * 新增要忽略的文件
 *
 * @param {Object} fis fis 实例
 * @param {Array.<string>} files 要忽略的文件 pattern
 */
function addIgnoreFiles(fis, files) {
    var config = require('./config');

    fis.set(
        'project.ignore',
        [].concat(config.INGORE_FILE_PATTERNS, files || [])
    );
}

/**
 * 获取组件安装的依赖目录
 *
 * @param {Object} fis fis 实例
 * @return {string}
 */
function getDepDir(fis) {
    return path.join(
        fis.project.getProjectPath(),
        fis.get('component.installDir')
    );
}

/**
 * 获取组件安装的依赖目录名
 *
 * @param {Object} fis fis 实例
 * @return {string}
 */
function getDepDirName(fis) {
    return fis.get('component.installDir');
}

/**
 * 添加要预处理的样式文件
 *
 * @param {Object} fis fis 实例
 * @param {Array.<string>} files 要处理的样式文件列表
 * @param {Object} options 样式处理自定义选项
 * @param {Object} options.compress 压缩选项，可选
 * @param {boolean=} useRelativePath 是否样式文件引用资源路径使用相对路径，可选，默认 false
 */
function addProcessStyleFiles(fis, files, options, useRelativePath) {
    var depDir = getDepDir(fis);

    var _ = fis.util;
    var opts = _.assign({}, options);
    var compressOpt = opts.compress;
    delete opts.compress;

    files.forEach(function (link) {
        var rExt = path.extname(link).toLowerCase();
        if (rExt === '.less') {
            fis.match(link, {
                parser: fis.plugin('less2', _.assign({
                    paths: [depDir]
                }, opts || {})),
                rExt: '.css'
            });
        }
        else if (rExt === '.styl') {
            fis.match(link, {
                parser: fis.plugin('stylus', opts),
                rExt: '.css'
            });
        }

        useRelativePath && fis.match(link, {
            relative: true
        });

        fis.match(link, {
            useHash: true
        });

        fis.media('prod').match(link, {
            optimizer: fis.plugin('css-compressor', compressOpt)
        });
    });
}

/**
 * 初始化预处理的样式文件
 *
 * @param {Object} fis fis 实例
 * @param {Array|Object} pageFilePatterns 要提取引用的样式文件的页面 pattern,或者提取选项
 * @param {Array.<string>=} pageFilePatterns.files 要处理的文件的 pattern，默认处理 .html,.tpl 文件
 * @param {function(string):boolean=} pageFilePatterns.filter 过滤要返回的文件路径，可选，默认所
 *                                    有提取的文件路径全部返回
 * @param {function(string):string=} pageFilePatterns.preprocess 对要返回的路径做预处理，可选，
 *                                    默认直接返回原始提取的文件路径
 * @param {Object} options 样式处理自定义选项
 * @param {boolean=} useRelativePath 是否样式文件引用资源路径使用相对路径，可选，默认 true
 */
function initProcessStyleFiles(fis, pageFilePatterns, options, useRelativePath) {
    var _ = fis.util;
    var isArr = Array.isArray(pageFilePatterns);
    var processFilePatterns = isArr
        ? pageFilePatterns : pageFilePatterns.files;
    var extractOpt = {
        files: findProjectFiles(fis, processFilePatterns || ['**/*.{tpl,html}']),
        filter: !isArr && pageFilePatterns.filter,
        preprocess: !isArr && pageFilePatterns.preprocess
    };
    var styleFiles = _.extractLinkStyleFileSync(extractOpt);

    addProcessStyleFiles(
        fis, styleFiles, options,
        useRelativePath !== false
    );
}

/**
 * 设置发布目录
 *
 * @param {Object} fis fis 实例
 * @param {string} dir 要设置的发布的目录
 */
function setReleaseDir(fis, dir) {
    fis.set('release.dir', dir || 'output');

    // 设置默认的发布目录
    fis.match('*', {
        deploy: fis.plugin('local-deliver', {
            to: fis.get('release.dir')
        })
    });
}

/**
 * 预处理包的配置
 *
 * @param {Object} fis fis 实例
 * @param {?Array.<Object>} pkgConfs 包的配置
 * @return {?Array}
 */
function preprocessPackagesConfig(fis, pkgConfs) {
    if (!pkgConfs) {
        return;
    }

    var isProd = isProductionEnv(fis);
    return pkgConfs.map(function (pkg) {
        var main = isProd ? pkg.main : pkg.devMain;
        main || (main = pkg.main);
        pkg.main = main;

        delete pkg.devMain;
        return pkg;
    });
}


/**
 * 获取模块配置
 *
 * @param {Object} fis fis 实例
 * @return {Object}
 */
function getModuleConfig(fis) {
    var manifest = require(path.join(
        fis.project.getProjectPath(), fis.get('component.manifestFile')
    ));

    if (manifest) {
        var moduleInfo = manifest[fis.get('component.saveTargetKey')] || manifest;
        var requireConfig = moduleInfo[fis.get('component.moduleConfigKey')] || {};

        // 预处理下包配置：移除自定义的字段
        requireConfig.packages = preprocessPackagesConfig(
            fis, requireConfig.packages || []
        );
    }
    else {
        requireConfig = {};
    }

    if (!requireConfig.baseUrl) {
        requireConfig.baseUrl = 'src';
    }


    return requireConfig;
}

/**
 * 获取 emojify 图片
 *
 * @param {string} name emojify 名称
 * @return {string}
 */
function getEmojify(name) {
    var emoji = require('node-emoji');
    var tag = emoji.emojify(':' + name + ':');
    tag = util.format(tag, '');
    return tag;
}

/**
 * 获取 log 前缀
 *
 * @param {string} name emojify 名称
 * @return {string}
 */
function getLogPrefix(name) {
    return '\n ' + getEmojify(name) + ' ';
}

/**
 * 初始化 logger 工具
 *
 * @param {Object} fis fis 实例
 */
function initLogger(fis) {
    if (!fis.util.isWin()) {
        fis.log.on = {
            any: function (type, msg) {},
            debug: function (msg) {
                process.stdout.write(getLogPrefix('construction_worker') + msg + '\n');
            },
            notice: function (msg) {
                process.stdout.write(getLogPrefix('fallen_leaf') + msg + '\n');
            },
            warning: function (msg) {
                process.stdout.write(getLogPrefix('warning') + msg + '\n');
            },
            error: function (msg) {
                process.stdout.write(getLogPrefix('bangbang') + msg + '\n');
            }
        };
        fis.log.time = function () {
            var msg = util.format.apply(util, arguments);
            process.stdout.write(getLogPrefix('bell') + msg + '\n');
        };
        fis.log.emoji = function (name) {
            return getEmojify(name);
        };
    }
    else {
        fis.log.time = fis.log.info;
        fis.log.emoji = function () {
            return;
        };
    }
}

/**
 * 是否是生产环境
 *
 * @param {Object} fis fis 实例
 * @return {boolean}
 */
function isProductionEnv(fis) {
    return fis.project.currentMedia() === 'prod';
}

/**
 * 查询项目文件
 *
 * @param {Object} fis fis 实例
 * @param {Array} patterns 要查询的文件 pattern
 * @param {boolean=} noFormat 是否不格式化，直接返回原始的 fis.File 文件对象，默认 false
 * @return {Array.<{absolutePath: string, data: string}|File>}
 */
function findProjectFiles(fis, patterns, noFormat) {
    var files = fis.project.getSourceByPatterns(patterns);
    return Object.keys(files).map(function (subPath) {
        var item = files[subPath];
        if (noFormat) {
            return item;
        }

        var content = item.getContent();
        return {
            absolutePath: item.realpath,
            data: item.isText() ? content.toString() : content
        };
    });
}

/**
 * 初始化 fis 扩展
 *
 * @param {Object} fis fis 实例
 */
exports.init = function (fis) {
    var _ = fis.util;
    _.assign(_, require('fisx-helper'));
    fis.addIgnoreFiles = addIgnoreFiles.bind(this, fis);
    fis.addProcessStyleFiles = addProcessStyleFiles.bind(this, fis);
    fis.initProcessStyleFiles = initProcessStyleFiles.bind(this, fis);
    fis.setReleaseDir = setReleaseDir.bind(this, fis);
    fis.getModuleConfig = getModuleConfig.bind(this, fis);
    fis.isProduction = isProductionEnv.bind(this, fis);
    fis.getDepDir = getDepDir.bind(this, fis);
    fis.getDepDirName = getDepDirName.bind(this, fis);
    fis.findProjectFiles = findProjectFiles.bind(this, fis);

    initLogger(fis);

    // 重写 applyMatches 方法，主要为了修复 fis 的 plugin 不支持传入选择值非普通对象情况
    var rawApplyMatches = fis.util.applyMatches;
    fis.util.applyMatches = function () {
        var _ = fis.util;
        var rawCloneDeep = _.cloneDeep;

        _.cloneDeep = function () {
            var args = arguments;
            var flag;
            if (args.length === 1
                || (flag = args.length === 2 && !_.isFunction(args[1]))
            ) {
                args = Array.prototype.slice.apply(args);
                if (flag) {
                    args[2] = args[1];
                }

                args[1] = function (value) {
                    // 对于非普通对象，直接不克隆，主要为了避免传入的选项值是某些实例对象，
                    // 比如 less 的 plugin 的值
                    if (value && typeof value === 'object'
                        && !_.isArray(value)
                        && !_.isPlainObject(value)
                    ) {
                        return value;
                    }
                };
            }

            return rawCloneDeep.apply(this, args);
        };

        var result = rawApplyMatches.apply(this, arguments);
        _.cloneDeep = rawCloneDeep;

        return result;
    };
};
