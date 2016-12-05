/**
 * @file 命令行运行入口
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var extension = require('./extension');
var config = require('./config');

function init(fis, argv, env) {
    fis.project.setProjectRoot(env.cwd);
    extension.init(fis);
    config.init(fis);

    if (argv.verbose) {
        fis.log.level = fis.log.L_ALL;
    }
    fis.set('options', argv);

    // 如果指定了 media 值
    var cmdName = argv._[0];
    if (~['release', 'inspect'].indexOf(cmdName) && argv._[1]) {
        fis.project.currentMedia(argv._[1]);
    }

    env.configPath = env.configPath || argv.f || argv.file;
    fis.log.throw = cmdName !== 'release';
}

function loadProjectConfig(fis, argv, env) {
    var cmdName = argv._[0];
    var needInitConfig = (cmdName === 'server' && argv.release)
        || cmdName === 'release';

    // 非 release 处理: 不加载 fis.config 提升命令行启动速度
    if (!env.configPath || !needInitConfig) {
        return;
    }

    try {
        require(env.configPath);
    }
    catch (e) {
        if (~['release', 'inspect'].indexOf(cmdName)) {
            fis.log.error(
                'Load %s error: %s \n %s',
                env.configPath, e.message, e.stack
            );
        }
        else {
            fis.log.warn(
                'Load %s error: %s',
                env.configPath, e.message
            );
        }
    }

    fis.emit('conf:loaded');

    var media = fis.project.currentMedia();
    if (media !== 'dev' && !~Object.keys(fis.config._groups).indexOf(media)) {
        fis.log.warn(
            'You don\'t have any configurations under the media `%s`, are you sure?',
            media
        );
    }
}

/**
 * fisx 命令行执行入口。
 *
 * @param {Object} fis fis 实例
 * @param {Array} argv 由 {@link https://github.com/substack/minimist minimist}
 *        解析得到的 argv, 已经转换成了对象。
 * @param {Array} env liftoff env
 * @return {*}
 */
function run(fis, argv, env) {
    // init fisx
    init(fis, argv, env);

    // init project configure
    loadProjectConfig(fis, argv, env);

    var cli = this;
    if (fis.media().get('options.color') === false) {
        cli.colors.mode = 'none';
    }

    var location = env.modulePath
        ? path.dirname(env.modulePath)
        : path.join(__dirname, '../');
    fis.log.info('Currently running %s (%s)', cli.name, location);
    if (!argv._.length) {
        return cli[argv.v || argv.version ? 'version' : 'help']();
    }

    // register command
    var cmdName = argv._[0];
    var commander = cli.commander = require('commander');
    var cmd = fis.require('command', cmdName);

    if (!cmd.register) {
         cmd.run(argv, cli, env);
        return;
    }

    // [node, realPath(bin/fis.js)]
    var argvRaw = process.argv;
    // fix args
    var p = argvRaw.indexOf('--no-color');
    ~p && argvRaw.splice(p, 1);

    p = argvRaw.indexOf('--media');
    ~p && argvRaw.splice(p, argvRaw[p + 1][0] === '-' ? 1 : 2);

    // 兼容旧插件。
    cmd.register(
        commander
            .command(cmd.name)
            .usage(cmd.usage)
            .description(cmd.desc)
    );
    commander.parse(argvRaw);
}

module.exports = exports = run;

