/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const {ipcRenderer, remote} = window.require('electron');
const {serializeArray} = require('./util.js');

require('./styles/setting.css');

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
