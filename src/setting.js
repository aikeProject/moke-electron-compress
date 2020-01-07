/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const {ipcRenderer, remote} = window.require('electron');
const {serializeArray} = require('./util.js');
const path = window.require('path');

require('./styles/setting.css');

// 默认保存到桌面
let outPath = remote.app.getPath('desktop');
// 默认输出到此文件夹
const defaultOutDir = 'moke-compress';

document.querySelector('#outPath').value = path.join(outPath, defaultOutDir);

document.querySelector('#select').addEventListener('click', () => {

    remote.dialog.showOpenDialog({
        title: '选择压缩图片存储路径',
        properties: ['openDirectory'],
        message: '选择压缩图片存储路径'
    }).then(({filePaths}) => {
        document.querySelector('#outPath').value = filePaths[0] || ''
    });

});

document.querySelector('#noCompress').addEventListener('change', (e) => {
    const quality = document.querySelector('#quality');
    if (e.target.checked) {
        quality.disabled = true;
        quality.style.cursor = 'not-allowed';
    } else {
        quality.disabled = false;
        quality.style.cursor = 'pointer';
    }
});

document.querySelector('#settingSave').addEventListener('click', () => {

    let result = serializeArray(document.querySelector('#settings'));

    result = result.reduce((pre, item) => {
        return {...pre, [item.name]: item.value};
    }, {});

    ipcRenderer.send('settings', result);

    remote.getCurrentWindow().close();
});
