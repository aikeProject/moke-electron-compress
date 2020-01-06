#!/usr/bin/env bash

if [[ `command -v python` ]];then
    echo 'python 已经安装'
    echo "安装的python版本为：$(python --version)"
fi

if [[ "$(uname)"=="Darwin"  ]];then
    echo "Mac OS X 操作系统"
elif [[ "$(expr substr $(uname -s) 1 5)"=="Linux" ]];then
    echo "GNU/Linux操作系统"
elif [[ "$(expr substr $(uname -s) 1 10)"=="MINGW32_NT" ]];then
    echo "Windows NT操作系统"
fi

a=`uname  -a`

b="Darwin"
c="centos"
d="ubuntu"

if [[ $a =~ $b ]];then
    echo "mac"
elif [[ $a =~ $c ]];then
    echo "centos"
elif [[ $a =~ $d ]];then
    echo "ubuntu"
else
    echo $a
fi

export CHENGYU_LOCAL=true

if [[ -z $CHENGYU_LOCAL ]]; then
    echo $CHENGYU_LOCAL
else
    echo $CHENGYU_LOCAL
fi

cd node_modules/sharp
echo $(pwd)

if [[ `command -v xcode-select` ]]; then
    echo 'xcode-select'
fi

if [[ `command -v xcode` ]]; then
    echo 'xcode'
fi

a=false

if [[ ${a} == false ]]; then
    echo "false"
fi
