/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const { ipcRenderer, remote } = require('electron');

let parent = '';

document.querySelector('#select').addEventListener('click', () => {

    remote.dialog.showOpenDialog({
        title: '选择压缩图片存储路径',
        properties: ['openDirectory'],
        message: '选择压缩图片存储路径'
    }).then(({ filePaths }) => {
        document.querySelector('#outPath').value = filePaths[0] || ''
    });

});

document.querySelector('#settingSave').addEventListener('click', () => {

    const quality = document.querySelector('#quality').value;
    const outPath = document.querySelector('#outPath').value;

    ipcRenderer.send('settings', {
        quality,
        outPath
    });

    remote.getCurrentWindow().close();
});
