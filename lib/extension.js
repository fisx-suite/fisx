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
 * 初始化 fis 扩展
 *
 * @param {Object} fis fis 实例
 */
exports.init = function (fis) {
    var _ = fis.util;
    _.assign(_, require('fisx-helper'));

    fis.addIgnoreFiles = addIgnoreFiles.bind(this, fis);
    fis.addProcessStyleFiles = addProcessStyleFiles.bind(this, fis);
};
