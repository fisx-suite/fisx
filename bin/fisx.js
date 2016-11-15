#!/usr/bin/env node

/**
 * @file 命令行入口
 * @author sparklewhy@gmail.com
 */

var Liftoff = require('liftoff');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var solutionName = 'fisx';
var cli = new Liftoff({
    name: solutionName,
    processTitle: solutionName,
    moduleName: solutionName,
    configName: 'fis-conf',

    // only js supported!
    extensions: {
        '.js': null
    }
});

cli.launch({
    cwd: argv.r || argv.root,
    configPath: argv.f || argv.file
}, function (env) {
    var fis;
    if (!env.modulePath) {
        fis = require('../');
    }
    else {
        fis = require(env.modulePath);
    }

    process.title = this.name +' ' + process.argv.slice(2).join(' ') + ' [ ' + env.cwd + ' ]';

    // windows 7 下 模块 name 名称可能不存在，这里强制赋值
    env.modulePackage || (env.modulePackage = {});
    env.modulePackage.name = solutionName;

    // 配置插件查找路径，优先查找本地项目里面的 node_modules
    // 然后才是全局环境下面安装的 fis3 目录里面的 node_modules
    // 最后是安装的 fis3 依赖的 node_modules
    fis.require.paths.unshift(path.join(env.cwd, 'node_modules'));
    fis.require.paths.push(path.join(path.dirname(__dirname), 'node_modules'));
    fis.require.paths.push(path.join(
        path.dirname(__dirname),
        'node_modules',
        'fis3',
        'node_modules'
    ));
    fis.cli.name = this.name;
    fis.cli.run(argv, env);
});
