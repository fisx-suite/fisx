/**
 * @file fisx 主模块
 * @author sparklewhy@gmail.com
 */

var fis = module.exports = require('fis3');
fis.require.prefixes.unshift('fisx');

fis.cli.name = 'fisx';
fis.cli.info = require('./package.json');
fis.cli.version = require('./lib/version');
fis.cli.run = require('./lib/run').bind(fis.cli, fis);





