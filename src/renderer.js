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
const {
    schemaConfig
} = require('./config.js');
const {
    flattenArr,
    objToArr,
    firstLastArr,
    flattenSize
} = require('./util');

require('./styles/index.css');

const versionNode = process.versions.node;
const versionElectron = process.versions.electron;

console.log('渲染进程...');
console.log(`👋 node version ${versionNode}`);
console.log(`👋 electron version ${versionElectron}`);

// 本地数据
const settingsStore = new Store({
    name: 'Settings',
    schema: schemaConfig
});

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
    quality: Number(quality),
    chromaSubsampling: '4:4:4'
};

function setSettings() {
    outPath = settingsStore.get('outPath');
    quality = settingsStore.get('quality');
    noCompress = settingsStore.get('noCompress');
    resizeWidth = Number(settingsStore.get('width')) || 0;
    resizeHeight = Number(settingsStore.get('height')) || 0;
    tinifyKey = settingsStore.get('tinifyKey');
    isTinify = settingsStore.get('isTinify');

    defaultOpt.quality = Number(quality);

    console.log(`
    ------ 压缩配置 ------
    
    压缩质量quality:  ${quality}
    调整大小resize: ${resizeWidth} x ${resizeHeight}
    noCompress: ${noCompress}
    tinifyKey: ${tinifyKey}
    isTinify: ${isTinify}
    
    ------ 压缩配置 ------
    `)
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

/**
 * 检查是否都执行完毕了
 */
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

const resizeOption = {};

async function compressOne(file) {

    if (resizeWidth) resizeOption.width = resizeWidth;
    if (resizeHeight) resizeOption.height = resizeHeight;

    filesMap[file.id] = {
        ...file,
        compress: true,
        done: false,
        error: false,
        compressSize: null
    };

    try {
        let sharpData = await sharp(file.path);
        const type = file.type;

        if (!noCompress) {
            
            switch (type) {
                case ".png":

                    // BUG: https://github.com/lovell/sharp/issues?utf8=%E2%9C%93&q=libimagequant
                    // libvips: https://libvips.github.io/libvips/install.html
                    // 后续修改吧，png调整图片质量需要安装支持的 libimagequant 的 libvips
                    // 默认安装的sharp中的libvips，并不包括 libimagequant
                    // 目前 png 就先采用jpg的方式压缩吧...

                    // sharpData = await sharpData
                    //     .png({palette: true, ...defaultOpt});
                    // break;
                case ".jpg":
                    ;
                case ".jpeg":
                    sharpData = await sharpData
                        .jpeg(defaultOpt);
                    break;
                default:
                    break;
            }
        }

        // 调整图片大小
        if (resizeOption.width || resizeOption.height) {
            sharpData = await sharpData.resize(resizeOption)
        }

        const {
            data,
            info
        } = await sharpData.toBuffer({
            resolveWithObject: true
        });

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

        return Promise.resolve(filesMap, data, info);

    } catch (err) {

        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                done: true,
                error: true
            }
        };

        console.log(err);
        console.log('error...', file.name);

        render(filesMap);

        return Promise.reject(err);
    };
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

async function compressOneTinify(file) {

    try {

        filesMap[file.id] = {
            ...file,
            compress: true,
            done: false,
            error: false,
            compressSize: null
        };

        const readFileBuffer = await fs.promises.readFile(file.path);
        const tinifyData = await tinify.fromBuffer(readFileBuffer);
        const writeTinifyBuffer = await tinifyData.toBuffer();
        await fs.promises.writeFile(path.join(outPath, file.name), writeTinifyBuffer);

        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                compressSize: writeTinifyBuffer.byteLength,
                compress: false,
                done: true,
            }
        };

        console.log(file.name);

        render(filesMap);

        return Promise.resolve(filesMap, writeTinifyBuffer);
    } catch (err) {
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

        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                done: true,
                error: true
            }
        };

        console.log(err);
        console.log('error...', file.name);

        render(filesMap);

        return Promise.reject(err);
    }
}

/**
 * 使用tinify的方式
 */
async function compressTinify(firstLast) {
    tinify.key = tinifyKey;
    const errValidate = await tinify.validate();
    let compressionsThisMonth = 500 - tinify.compressionCount;

    if (errValidate) {
        remote.dialog.showErrorBox('提示', 'tinify验证错误');
        return;
    }

    if (!compressionsThisMonth) {
        remote.dialog.showErrorBox('提示', '当前使用tinify key次数不足');
        return;
    }

    console.log(`
    tinify key： ${tinifyKey} 
    剩余次数，${compressionsThisMonth}
    `);

    const fn = () => {
        const one = firstLast.last.shift();

        if (one) {
            compressOneTinify(one).finally(() => {
                fn();

                compressDone();
            });
        }
    };

    if (firstLast.first.length) {

        let runFnGroup = firstLast.first.map(file => {
            return compressOneTinify(file).finally(() => {
                fn();
            });
        });

        // allSettled 只有等到所有这些参数实例都返回结果
        // 不管是fulfilled还是rejected，包装实例才会结束
        Promise.allSettled(runFnGroup).then(() => {
            compressDone();
        });
    }
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
            compress: false,
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

document.querySelector('#compress').addEventListener('click', () => {
    console.log(settingsStore.get());

    setSettings();

    compress();
});