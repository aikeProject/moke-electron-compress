/**
 * @author 成雨
 * @date 2019/11/27
 * @Description:
 */

const {
    ipcRenderer,
    remote,
    shell
} = window.require('electron');
const path = window.require('path');
const fs = window.require('fs');
const uuidV4 = require('uuid/v4');
const mkdirp = require('mkdirp');
const sharp = window.require('sharp');
const tinify = window.require("tinify");
const Store = window.require('electron-store');
const {schemaConfig} = require('./config.js');
const {flattenArr, objToArr, firstLastArr} = require('./util');

require('./styles/index.css');

const versionNode = process.versions.node;
const versionElectron = process.versions.electron;

console.log('渲染进程...');
console.log(`👋 node version ${versionNode}`);
console.log(`👋 electron version ${versionElectron}`);

// 本地数据
const settingsStore = new Store({name: 'Settings', schema: schemaConfig});

console.log('------ config ------');
console.log(settingsStore.get());
console.log('------ config ------');

settingsStore.clear();

let filesMap = {};
let compressing = false;

// 默认保存到桌面
let outPath = settingsStore.get('outPath'),
    // 默认压缩质量
    quality = settingsStore.get('quality'),
    // 是否压缩
    noCompress = settingsStore.get('noCompress'),
    // 分组压缩 默认 5
    chunkCount = 5,
    // resize width height
    resizeWidth = Number(settingsStore.get('width')) || 0,
    resizeHeight = Number(settingsStore.get('height')) || 0,
    tinifyKey = settingsStore.get('tinifyKey'),
    isTinify = settingsStore.get('isTinify');

const defaultOpt = {
    quality: quality,
    chromaSubsampling: '4:4:4'
};

const resizeOption = {};

function setSettings() {
    outPath = settingsStore.get('outPath');
    quality = settingsStore.get('quality');
    noCompress = settingsStore.get('noCompress');
    resizeWidth = Number(settingsStore.get('width')) || 0;
    resizeHeight = Number(settingsStore.get('height')) || 0;
    tinifyKey = settingsStore.get('tinifyKey');
    isTinify = settingsStore.get('isTinify');

    console.log('------ 压缩配置 ------');
    console.log('压缩质量: ', quality);
    console.log('调整大小resize: ', `${resizeWidth} x ${resizeHeight}`);
    console.log('noCompress：', noCompress);
    console.log('tinifyKey：', tinifyKey);
    console.log('isTinify：', isTinify);
    console.log('------ 压缩配置 ------');
}

function flattenSize(size) {
    if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)}MB`;

    return `${(size / 1024).toFixed(2)}kb`
}

function filterSource(source) {
    const fileType = /image\/(png|jpg|jpeg)/;
    let files = [].slice.apply(source);

    files = files.filter(file => {
        return fileType.test(file.type)
    });

    files = files.map(file => {
        return {
            id: uuidV4().split('-').join(''),
            name: file.name,
            path: file.path,
            size: file.size,
            type: path.extname(file.name),
            compress: false,
            compressSize: null,
            done: false,
            error: false
        }
    });

    filesMap = flattenArr(files);

    return filesMap
}

function render(files) {

    files = objToArr(files);
    const listGroup = document.querySelector('#list-group');
    let str = '';

    if (!files.length) return [];

    document.querySelector('.background-drop').style.display = 'none';

    files.forEach(file => {

        let progress = '';

        if (!file.error) {
            const done = file.done ? 'bg-success' : 'progress-bar-striped';
            const pending = file.compress ?
                'progress-bar-animated bg-success' :
                file.done ? '' : 'bg-warning';
            progress = `progress-bar ${done} ${pending}`;
        } else {
            progress = 'progress-bar progress-bar-striped bg-danger'
        }

        str += `<li class="list-group-item" style="position: relative;">
                    <div class="name ellipsis">${file.name}</div>
                    <div class="size">
                        <div class="size--pending">${flattenSize(file.size)}</div>
                        <div class="size--success">${file.compressSize ? flattenSize(file.compressSize) : ''}</div>
                    </div>
                    <div class="progress">
                        <div style="width: 100%;" class="${progress}"></div>
                    </div>
                    <button
                        onclick="compressRetry('${file.id}')"
                        style="${file.error ? 'display: block;' : 'display: none;'}" 
                        class="btn btn-success btn-sm retry">重试</button>
                </li>`;
    });

    listGroup.innerHTML = str;

    // 按钮状态
    compressBtn()
}

function compressInfo(file, resolve) {
    return ({data, info}) => {

        const out = path.join(outPath, file.name);

        fs.writeFileSync(out, data);

        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                compressSize: info.size,
                compress: false,
                done: true,
            }
        };

        console.log(file.name);

        render(filesMap);

        resolve(filesMap);
    }
}

function compressError(file, reject) {
    return (err) => {
        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                done: true,
                error: true
            }
        };
        compressing = false;

        console.log('error...', file.name);

        render(filesMap);
        reject(err)
    }
}

function compressDone() {

    const allDone = Object.values(filesMap).every(file => file.done);
    const files = Object.values(filesMap);

    if (allDone) {
        compressing = false;

        render(filesMap);

        const errorCount = objToArr(filesMap).reduce((preCount, item) => {
            if (item.error) return ++preCount;
            return preCount;
        }, 0);

        console.log('---  files ---');
        console.log(filesMap);
        console.log('---  files ---');

        const notification = new window.Notification('压缩提示', {
            body: `总数：${files.length}，成功: ${files.length - errorCount}，失败：${errorCount}`
        });

        notification.onclick = function (event) {
            event.preventDefault();

            // 打开文件保存位置
            shell.showItemInFolder(path.join(outPath, files[0].name));
        }
    }
}

function compressBtn() {
    const compress = document.querySelector('#compress');
    if (compressing) {
        compress.setAttribute('disabled', 'true');
        compress.children[0].style.display = '';
    } else {
        compress.removeAttribute('disabled');
        compress.children[0].style.display = 'none';
    }
}

function compressOne(file) {

    if (resizeWidth) resizeOption.width = resizeWidth;
    if (resizeHeight) resizeOption.height = resizeHeight;

    return new Promise((resolve, reject) => {
        let fileData = sharp(file.path);

        const type = file.type;

        if (!type) return;

        if (!noCompress) {
            switch (type) {
                case "png":
                    fileData = fileData
                        .png(defaultOpt);
                    break;
                case "jpg":
                    ;
                case "jpeg":
                    fileData = fileData
                        .jpeg(defaultOpt);
                    break;
                default:
                    break;
            }
        }

        // 调整图片大小
        if (resizeOption.width || resizeOption.height) {
            fileData = fileData.resize(resizeOption)
        }

        // toBuffer 转换成buffer之后，拿到压缩后的信息，在保存到文件
        // toFile windows下输出文件，info信息里没有压缩后的size字段
        fileData
            .toBuffer({resolveWithObject: true})
            .then(compressInfo(file, resolve))
            .catch(compressError(file, reject));
    });
}

// 重试
window.timeout = null;

function compressRetry(id) {
    const file = filesMap[id];
    filesMap[id] = {
        ...file,
        compress: true,
        done: false,
        error: false,
        compressSize: null
    };

    render(filesMap);

    clearTimeout(window.timeout);

    window.timeout = setTimeout(() => {
        compressOne(file);
    }, 500);

}

window.compressRetry = compressRetry;

/**
 * 普通的压缩方式: 使用sharp的方式
 */
function compressCommon(firstLast) {
    const fn1 = () => {
        const one = firstLast.last.shift();

        if (one) {
            compressOne(one).finally(() => {
                fn1();

                compressDone();
            });
        }
    };

    if (firstLast.first.length) {

        let runFnGroup = firstLast.first.map(file => {
            return compressOne(file).finally(() => {
                fn1();
            });
        });

        // allSettled 只有等到所有这些参数实例都返回结果
        // 不管是fulfilled还是rejected，包装实例才会结束
        Promise.allSettled(runFnGroup).then(() => {
            compressDone();
        });
    }
}

/**
 * 使用tinify的方式
 */
function compressTinify(firstLast) {
    console.log('--');
    tinify.key = tinifyKey;
    tinify.validate(function (err) {
        if (err) throw err;

        let compressionsThisMonth = tinify.compressionCount;
        console.log(compressionsThisMonth);
    });

    tinify.fromFile("unoptimized.jpg").toFile("optimized.jpg").then((data) => {
        console.log(data);
    }, (err) => {
        if (err instanceof tinify.AccountError) {
            console.log("The error message is: " + err.message);
            // Verify your API key and account limit.
        } else if (err instanceof tinify.ClientError) {
            // Check your source image and request options.
        } else if (err instanceof tinify.ServerError) {
            // Temporary issue with the Tinify API.
        } else if (err instanceof tinify.ConnectionError) {
            // A network connection error occurred.
        } else {
            // Something else went wrong, unrelated to the Tinify API.
        }
    });

}

function compress() {

    const files = objToArr(filesMap);

    if (!files.length) return;
    if (compressing) return;
    if (noCompress && !isTinify && !resizeWidth && !resizeHeight) {
        remote.dialog.showErrorBox('提示', '请正确设置压缩配置');
        return;
    }
    if (isTinify && !tinifyKey) {
        remote.dialog.showErrorBox('提示', '请设置tinify key');
        return;
    }

    compressing = true;

    mkdirp.sync(outPath || settingsStore.get('outPath'));

    Object.values(filesMap).forEach(file => {
        filesMap[file.id] = {
            ...file,
            compress: true,
            done: false,
            error: false,
            compressSize: null
        }
    });

    render(filesMap);

    const firstLast = firstLastArr(files, chunkCount);

    if (isTinify) {
        compressTinify(firstLast);
    } else {
        compressCommon(firstLast);
    }
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    const files = filterSource(e.dataTransfer.files);
    render(files)

}

function handleDragover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

document.addEventListener('dragenter', handleDragover, false);
document.addEventListener('dragover', handleDragover, false);
document.addEventListener('drop', handleDrop, false);

document.querySelector('.background-drop').addEventListener('click', () => {
    document.querySelector('#select-files').click();
    document.querySelector('#select-files').addEventListener('change', (e) => {
        const files = filterSource(e.target.files);
        render(files);
    })
});

document.querySelector('#setting').addEventListener('click', () => {
    ipcRenderer.send('open-settings-window');
});

// ipcRenderer.on('settings', (event, args) => {
//     quality = Number(args.quality) || quality;
//     noCompress = Boolean(args.noCompress);
//     outPath = args.outPath || outPath;
//     resizeWidth = Number(args.width) || null;
//     resizeHeight = Number(args.height) || null;
// });

document.querySelector('#compress').addEventListener('click', () => {
    console.log(settingsStore.get());

    setSettings();

    compress();
});
