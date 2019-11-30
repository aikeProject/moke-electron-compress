/**
 * @author 成雨
 * @date 2019/11/27
 * @Description:
 */

const {ipcRenderer, remote} = require('electron');
const path = require('path');
const sharp = require('sharp');
const uuidV4 = require('uuid/v4');
const mkdirp = require('mkdirp');

require('./styles/index.css');

const versionNode = process.versions.node;
const versionElectron = process.versions.electron;

console.log('渲染进程...');
console.log(`👋 node version ${versionNode}`);
console.log(`👋 electron version ${versionElectron}`);

let filesMap = {};
let compressing = false;

// 默认保存到桌面
let outPath = remote.app.getPath('desktop');
// 默认输出到此文件夹
const defaultOutDir = 'moke-compress';
// 默认压缩质量
let quality = 70;
// 是否压缩
let noCompress = false;
// 分组压缩 默认 6
let chunkCount = 6;
// resize width height
let resizeWidth, resizeHeight;

const defaultOpt = {
    quality: quality,
    chromaSubsampling: '4:4:4'
};

const resizeOption = {};

const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item;
        return map
    }, {})
};

const objToArr = (obj) => {
    return Object.keys(obj).map(key => obj[key]);
};

const chunk = (arr, size) => {
    return Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
};

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

    files = files.map(file => ({
        id: uuidV4().split('-').join(''),
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type.split('/')[1],
        compress: false,
        compressSize: null,
        done: false,
        error: false
    }));

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
            const pending = file.compress
                ? 'progress-bar-animated bg-success' :
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
    return (info) => {
        filesMap = {
            ...filesMap,
            [file.id]: {
                ...file,
                compressSize: info.size,
                compress: false,
                done: true,
            }
        };

        compressing = compressDone();

        console.log(file.name);
        console.log('done...');

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
    return !Object.values(filesMap).every(file => file.done);
}

function compressBtn() {
    const compress = document.querySelector('#compress');
    if (compressing) {
        compress.setAttribute('disabled', 'true');
        compress.children[0].style.display = '';
    }
    else {
        compress.removeAttribute('disabled');
        compress.children[0].style.display = 'none';
    }
}

// 重试
window.timeout = null;

function compressRetry(id) {
    const file = filesMap[id];
    filesMap[id] = {...file, compress: true, done: false, error: false, compressSize: null};

    render(filesMap);

    clearTimeout(window.timeout);

    window.timeout = setTimeout(() => {
        compressOne(file);
    }, 500);

}

window.compressRetry = compressRetry;

function compressOne(file) {

    if (resizeWidth) resizeOption.width = resizeWidth;
    if (resizeHeight) resizeOption.height = resizeHeight;

    return new Promise((resolve, reject) => {
        let fileData = sharp(file.path);

        const type = file.type;

        if (!type) return;

        const out = path.join(outPath, defaultOutDir, file.name);

        if (!noCompress) {
            switch (type) {
                case "png":
                    fileData = fileData
                        .png(defaultOpt);
                    break;
                case "jpg":
                    fileData = fileData
                        .jpg(defaultOpt);
                    break;
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

        fileData
            .toFile(out)
            .then(compressInfo(file, resolve))
            .catch(compressError(file, reject));
    });
}

function compress() {

    const files = objToArr(filesMap);

    if (!files.length) return;
    if (compressing) return;
    if (noCompress && !resizeWidth && !resizeHeight) {
        remote.dialog.showErrorBox('提示', '请正确设置压缩选项');
        return;
    }
    compressing = true;

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

    const chunks = chunk(files, chunkCount);

    const chunkLength = chunks.length;
    let a = 0;

    const fn = () => {

        const oneChunk = chunks.shift();

        if (oneChunk) {

            let runChunk = oneChunk.map(file => {
                return compressOne(file)
            });

            // allSettled 只有等到所有这些参数实例都返回结果
            // 不管是fulfilled还是rejected，包装实例才会结束
            Promise.allSettled(runChunk).then(() => {
                a++;
                console.log('done chunk.....' + a);

                if (a === chunkLength) {

                    compressing = false;

                    render(filesMap);

                    const errorCount = objToArr(filesMap).reduce((preCount, item) => {
                        if (item.error) return ++preCount;
                        return preCount;
                    }, 0);

                    new window.Notification('MOKE压缩', {
                        body: `总数：${files.length}，成功: ${files.length - errorCount}，失败：${errorCount}`
                    });
                }

                fn();
            });
        }
    };

    fn();
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

ipcRenderer.on('settings', (event, args) => {
    quality = Number(args.quality) || quality;
    noCompress = Boolean(args.noCompress);
    outPath = args.outPath || outPath;
    resizeWidth = Number(args.width) || null;
    resizeHeight = Number(args.height) || null;
});

document.querySelector('#compress').addEventListener('click', () => {
    const out = path.join(outPath, defaultOutDir);
    mkdirp.sync(out);

    console.log('------ 压缩配置 ------');
    console.log('压缩质量: ', quality);
    console.log('调整大小resize: ', `${resizeWidth} x ${resizeHeight}`);
    console.log('------ 压缩配置 ------');

    compress()
});
