/**
 * @file fisx 默认配置定义
 * @author sparklewhy@gmail.com
 */

var DEFAULT_GITLAB_DOMAIN = 'http://gitlab.baidu.com/';

/**
 * 初始化包管理相关默认配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initComponent(fis) {
    fis.set('component.installDir', 'dep');
    fis.set('component.defaultEndPoint', {type: 'edp'});
    fis.set('component.defaultGitHubOwner', 'ecomfe');
    fis.set('component.saveTargetKey', 'edp');
    fis.set('component.moduleConfigKey', 'requireConfig');
    fis.set('component.manifestFile', 'package.json');
    fis.set('component.defaultGitlabDomain', DEFAULT_GITLAB_DOMAIN);
    fis.set('component.defaultGitlabToken',
        process.env['GITLAB_TOKEN'] || 'XsYDeyqyFD777qgovh15');
}

/**
 * 初始化服务器相关默认配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initServer(fis) {
    fis.set('server.configFile', 'server-conf.js');
}

/**
 * 初始化发布相关的默认配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initRelease(fis) {

    // 设置默认的发布目录
    fis.setReleaseDir('output');

    fis.match('*', {
        release: '$0'
    });

    fis.match(/^(.+)?\/src\/(.+)$/, {
        release: '$1/asset/$2' // src -> assept，及 dep 下的 src -> asset
    });

    // 所有 js 加 hash
    fis.match('*.js', {
        useHash: true
    });

    // 所有图片加 hash
    fis.match('image', {
        useHash: true
    });

    // 图片 sprite
    fis.match('::package', {
        spriter: fis.plugin('csssprites')
    });

    // 启用相对路径插件
    fis.hook('relative');

    // 上线发布
    fis.media('prod').match('*.js', {
        optimizer: fis.plugin('uglify-js')
    }).match('*.png', {
        optimizer: fis.plugin('png-compressor')
    });

    // 监听发布开始事件，滤掉一些不发布的文件
    fis.on('release:start', function (ret) {
        var src = ret.src;
        Object.keys(src).forEach(function (key) {
            var file = src[key];
            // 对于没有编译的预处理语言的样式文件不输出
            if (file.isCssLike && file.rExt === file.ext && file.ext !== '.css') {
                file.release = false;
            }
        });
    });
    fis.addIgnoreFiles();
}

/**
 * 初始化模块默认相关配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initModule(fis) {
    // 设置模块配置 默认占位符
    fis.set('placeholder.requireconfig', '<!--RESOURCECONFIG_PLACEHOLDER-->');
}

/**
 * 初始化脚手架默认相关配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initScaffold(fis) {
    fis.set('scaffold.namespace', 'fisx-scaffold');
    fis.set('scaffold.gitlabDomain', DEFAULT_GITLAB_DOMAIN);
    fis.set('scaffold.gitlabToken', process.env['GITLAB_TOKEN'] || 'XsYDeyqyFD777qgovh15');
}

/**
 * 初始化命令默认相关配置
 *
 * @inner
 * @param {Object} fis fis 实例
 */
function initCommand(fis) {
    var cmdConfName = 'modules.commands';
    var cmds = fis.get(cmdConfName, []);
    // builtin cmds: 'init', 'install', 'release', 'server', 'inspect'
    ['list', 'search', 'uninstall', 'update'].forEach(function (item) {
        if (cmds.indexOf(item) === -1) {
            cmds.push(item);
        }
    });

    fis.set(cmdConfName, cmds);
}

/**
 * 初始化 fisx 默认配置
 *
 * @param {Object} fis fis 实例
 */
exports.init = function (fis) {
    initCommand(fis);
    initScaffold(fis);
    initComponent(fis);
    initServer(fis);
    initModule(fis);
    initRelease(fis);
};

/**
 * 预定义的忽略的文件 pattern
 *
 * @const
 * @type {Array.<string>}
 */
exports.INGORE_FILE_PATTERNS = [
    'node_modules/**', 'output/**', 'fis-conf.js', 'doc/**',
    'test/**', 'tool/**', 'mock/**', 'templates_c/**', '**/module.conf',
    'dep/**/test/**', 'dep/**/tests/**', 'dep/**/doc/**', 'dep/**/demo/**',
    'dep/**/example/**', 'dep/packages.manifest', 'dep/**/tool/**', '.project',
    'Desktop.ini', 'issue.info', '.edpproj', '.svn', '.git', '.gitignore',
    '.idea', '**/Thumbs.db', '.DS_Store', '*.tmp', '*.bak', '*.swp',
    '**/*.bat', '**/*.sh', '**/*.md', '**/*.yml', '**/.jshintrc', '**/edp-*',
    '**/.npmignore', '**/.jshintignore', '*.htaccess', 'autoresponse-config.js',
    'watch-config.js', '**/package.json', '**/bower.json', '**/*.md5',
    '**/.fecsignore', '**/.editorconfig', '**/.fecsrc', '**/LICENSE',
    '**/karma.conf.js', '**/README', 'server-conf.js', 'views_c/**'
];
