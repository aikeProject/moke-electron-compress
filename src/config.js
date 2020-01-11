/**
 * @author 成雨
 * @date 2020/1/8
 * @Description: config
 */

/**
 * 表单设置时，数据对应的值设置方式
 * @type {{outPath: string, tinifyKey: string, isTinify: string, width: string, noCompress: string, quality: string, height: string}}
 */
const settingsKeyType = {
    quality: 'value',
    width: 'value',
    height: 'value',
    outPath: 'value',
    tinifyKey: 'value',
    noCompress: 'disabled',
    isTinify: 'disabled'
};


module.exports = {
    settingsKeyType
};
