#!/bin/bash

# 淘宝npm源
#registry="https://registry.npm.taobao.org"

# 打印debug信息，查看是否换源成功
export DEBUG="*"


# 换源安装electron#7.1.2

export ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"
export ELECTRON_CUSTOM_DIR="7.1.2"

npm i electron@7.1.2 -D

# 换源安装sharp

npm i node-gyp@5.0.7 -D

# 设置环境变量
export SHARP_DIST_BASE_URL="https://npm.taobao.org/mirrors/sharp-libvips/v8.8.1/"

npm i sharp@0.23.3 -D
