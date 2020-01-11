/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const {ipcRenderer, remote, shell} = window.require('electron');
const {serializeArray} = require('./util.js');
const path = window.require('path');
const Store = window.require('electron-store');

require('./styles/setting.css');

// 默认保存到桌面
let outPath = remote.app.getPath('desktop');
// 默认输出到此文件夹
const defaultOutDir = 'MokeCompress';
// 本地数据
const settingsStore = new Store({name: 'Settings'});
const sourceStore = new Store({name: 'source'});

document.querySelector('#quality').value = '20';
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
    console.log(result);
    result = result.reduce((pre, item) => {
        // settingsStore.set(item.name, item.value);
        return {...pre, [item.name]: item.value};
    }, {});

    ipcRenderer.send('settings', result);

    settingsStore.set(result);

    const tinifyKeyArray = [];

    document.querySelectorAll('#tinifyKey > option').forEach((el) => {
        tinifyKeyArray.push(el.value);
    });

    sourceStore.set('tinifyKey', tinifyKeyArray);
    // remote.getCurrentWindow().close();
});

const links = document.querySelectorAll('a[href]');

Array.prototype.forEach.call(links, function (link) {
    const url = link.getAttribute('href');
    if (url.indexOf('http') === 0) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            shell.openExternal(url)
        });
    }
});
