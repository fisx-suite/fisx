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

    // windows 7 下 模块 name 名称可能不存在，这里强制赋值
    env.modulePackage || (env.modulePackage = {});
    env.modulePackage.name = solutionName;

    fis.set('system.localNPMFolder', path.join(env.cwd, 'node_modules/fis3'));
    fis.set('system.globalNPMFolder', path.dirname(__dirname));
    fis.cli.name = this.name;
    fis.cli.run(argv, env);
});
