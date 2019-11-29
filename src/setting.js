/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const {ipcRenderer, remote} = require('electron');
const {serializeArray} = require('../util.js');

document.querySelector('#select').addEventListener('click', () => {

    remote.dialog.showOpenDialog({
        title: '选择压缩图片存储路径',
        properties: ['openDirectory'],
        message: '选择压缩图片存储路径'
    }).then(({filePaths}) => {
        document.querySelector('#outPath').value = filePaths[0] || ''
    });

});

document.querySelector('#settingSave').addEventListener('click', () => {

    let result = serializeArray(document.querySelector('#settings'));

    result = result.reduce((pre, item) => {
        return {...pre, [item.name]: item.value};
    }, {});

    ipcRenderer.send('settings', result);

    remote.getCurrentWindow().close();
});
