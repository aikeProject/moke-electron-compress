#!/usr/bin/env bash

set -e

# electron版本
electron="7.1.2"

if [[ `command -v python` ]];then
    echo 'python 已经安装...'
    echo "安装的python版本为：$(python --version)"
    printf "\n"
else
   echo '需要安装python...'
fi

# node-gyp 工具重新编译sharp，以适应当前版本electron
# https://electronjs.org/docs/tutorial/using-native-node-modules#%E4%B8%BA-electron-%E6%89%8B%E5%8A%A8%E7%BC%96%E8%AF%91
npm i node-gyp@5.0.7 -D -E

echo "重新编译sharp"
cd node_modules/sharp
echo "切换到sharp目录下: $(pwd)"
echo "npx node-gyp rebuild --target=${electron} --arch=x64 --dist-url=https://electronjs.org/headers"
#export HOME="~/.electron-gyp"
npx node-gyp rebuild --target=${electron} --arch=x64 --dist-url=https://electronjs.org/headers
