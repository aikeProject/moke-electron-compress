/**
 * @author 成雨
 * @date 2019/11/28
 * @Description: 设置信息
 */

const {ipcRenderer, remote, shell} = window.require('electron');
const {serializeArray} = require('./util.js');
const {schemaConfig, settingsKeyType, outDefault} = require('./config.js');
const Store = window.require('electron-store');

require('./styles/setting.css');

// 本地数据
const settingsStore = new Store({name: 'Settings', schema: schemaConfig});
const sourceStore = new Store({name: 'source'});

// 设置
const tinifyKeyEl = document.querySelector('#tinifyKey');

(sourceStore.get('tinifyKey') || []).map((key, index) => {
    const option = document.createElement('option');
    option.value = key;
    option.innerText = key;
    if (index === 0) option.selected = 'selected';

    tinifyKeyEl.appendChild(option);
});

Object.keys(settingsKeyType).map((key) => {
    if (settingsStore.get(key)) {
        document.querySelector(`#${key}`)[settingsKeyType[key]] = settingsStore.get(key);
    }
});

function getTinifyKeyArray() {
    const tinifyKeyArray = [];

    document.querySelectorAll('#tinifyKey > option').forEach((el) => {
        tinifyKeyArray.push(el.value.trim());
    });

    return tinifyKeyArray;
}

document.querySelector('#select').addEventListener('click', () => {

    remote.dialog.showOpenDialog({
        title: '选择压缩图片存储路径',
        properties: ['openDirectory'],
        message: '选择压缩图片存储路径'
    }).then(({filePaths}) => {
        document.querySelector('#outPath').value = filePaths[0] || outDefault;
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

        if (settingsKeyType[item.name] === 'checked') {
            return {...pre, [item.name]: Boolean(item.value)};
        }

        return {...pre, [item.name]: item.value.trim()};
    }, {});

    (Object.keys(settingsKeyType)).map((key) => {
        if (!(key in result) && settingsKeyType[key] === 'checked') {
            result[key] = false;
        }
    });

    settingsStore.set(result);

    const tinifyKeyArray = getTinifyKeyArray();

    sourceStore.set('tinifyKey', tinifyKeyArray);
    remote.getCurrentWindow().close();
});

document.querySelector('#saveTinifyKey').addEventListener('click', () => {
    const value = document.querySelector('#inTinifyKey').value;
    const option = document.createElement('option');
    option.value = value;
    option.innerText = value;

    if (!value || getTinifyKeyArray().indexOf(value) > -1) return;

    tinifyKeyEl.appendChild(option);
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
