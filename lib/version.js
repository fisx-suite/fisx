/**
 * @file 显示版本信息
 * @author sparklewhy@gmail.com
 */

module.exports = exports = function () {
    console.log('\n ' + this.info.name + ' version ' + this.info.version.green + '\n');
};
