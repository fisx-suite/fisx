/**
 * @file fis 扩展接口定义
 * @author sparklewhy@gmail.com
 */

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
 * 添加要预处理的样式文件
 *
 * @param {Object} fis fis 实例
 * @param {Array.<string>} files 要处理的样式文件列表
 * @param {Object} options 样式处理自定义选项
 * @param {boolean=} useRelativePath 是否样式文件引用资源路径使用相对路径，可选，默认 false
 */
function addProcessStyleFiles(fis, files, options, useRelativePath) {
    var path = require('path');
    var depDir = path.join(
        fis.project.getProjectPath(),
        fis.get('component.installDir')
    );

    var _ = fis.util;
    files.forEach(function (link) {
        var rExt = path.extname(link).toLowerCase();
        if (rExt === '.less') {
            fis.match(link, {
                parser: fis.plugin('less', _.assign({
                    paths: [depDir]
                }, options || {})),
                rExt: '.css'
            });
        }
        else if (rExt === '.styl') {
            fis.match(link, {
                parser: fis.plugin('stylus', options),
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
            optimizer: fis.plugin('css-compressor')
        });
    });
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
 * 获取模块配置
 *
 * @param {Object} fis fis 实例
 * @return {Object}
 */
function getModuleConfig(fis) {
    var path = require('path');
    var manifest = require(path.join(
        fis.project.getProjectPath(), fis.get('component.manifestFile')
    ));

    if (manifest) {
        var moduleInfo = manifest[fis.get('component.saveTargetKey')] || manifest;
        return moduleInfo[fis.get('component.moduleConfigKey')];
    }

    return {};
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
    fis.setReleaseDir = setReleaseDir.bind(this, fis);
    fis.getModuleConfig = getModuleConfig.bind(this, fis);

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
