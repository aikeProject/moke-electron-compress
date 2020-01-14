/**
 * @author 成雨
 * @date 2020/1/8
 * @Description: config
 */

const {remote} = window.require('electron');


// 默认保存到桌面
let outPathDefault = remote.app.getPath('desktop');
// 默认输出到此文件夹
const defaultOutDir = 'MokeCompress';
const path = window.require('path');
const outDefault = path.join(outPathDefault, defaultOutDir);

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

const schemaConfig = {
    quality: {
        type: 'string',
        default: '70'
    },
    width: {
        type: 'string',
        default: ''
    },
    height: {
        type: 'string',
        default: ''
    },
    outPath: {
        type: 'string',
        default: outDefault
    },
    tinifyKey: {
        type: 'string',
        default: ''
    },
    noCompress: {
        type: 'boolean',
        default: false
    },
    isTinify: {
        type: 'boolean',
        default: false
    },
};


module.exports = {
    settingsKeyType,
    schemaConfig,
    outDefault
};
