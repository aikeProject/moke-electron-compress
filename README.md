### electron 图片压缩工具

<p>
    <img width="200" src="./docs/moke1.jpg" alt="compress1">
    <img width="200" src="./docs/moke2.jpg" alt="compress2">
    <img width="200" src="./docs/moke3.jpg" alt="compress3">
</p>

#### 下载

- `Mac` [moke-compress-1.0.0.dmg](https://github.com/aikeProject/moke-electron-compress/releases)
- `windows` (暂无)...
- `linux` (暂无)...

#### 实现简单的压缩图片功能（png、jpg、jpeg）

- 1 通过调整图片质量压缩图片
- 2 可以调整图片实际宽度和高度

#### `Electron` 相关知识

- 主进程
- 渲染进程
- 主进程与渲染进程间通信 `ipcMain` 与 `ipcRenderer`
- 不同窗口间的通信
- 通知
- 拖拽
- 菜单设置
- `electron.app` 上的一些方法
    - `remote.app.getPath('desktop')`, 获取路径 [详见](https://electronjs.org/docs/api/app#appgetpathname)

#### 压缩图片使用的工具 `sharp`

```
npm i sharp
```

#### 本地开发项目运行

```
npm start
```

#### 开发环境搭建 [环境搭建参考项目](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

- `npm run start-renderer-dev` 启动渲染进程
- `npm run start-main-dev` 启动主进程
- `webpack` 配置主要需要注意构建目标 `target` 配置，对于主进程使用`electron-main`,渲染进程`electron-renderer` 
[详见](https://www.webpackjs.com/configuration/target/#target)


#### `Electron` 打包相关

- `electron-builder` 详细配置参考： [详细](https://www.npmjs.com/package/electron-builder)，
[文档](https://www.electron.build/)

```
npm i electron-builder -D
```

- 打包优化 [详细](https://imweb.io/topic/5b6817b5f6734fdf12b4b09c)

```
主要思路：(js、css、html....)等资源，先用`webpack`打包，
再将打包好的静态资源，使用`electron-builder`打包进安装包里面
```

- 分析安装包内容

    - `app.asar`
    
    ```
    # 安装 asar
    npm install -g asar
    
    # 解压到 ./app 文件夹下
    asar extarct app.asar ./app
    ```

#### 打包发布配置，自动发布release [详情](https://www.electron.build/configuration/publish)

- 使用 github release 进行发布
- 将项目关联到 github
- `package.json配置`

```
{
  "build":
    "publish": ["github"]
  }
}
```

- 生成 GitHub personal access token [add token](https://github.com/settings/tokens/new),
生成token后添加如下配置，将`GH_TOKEN`添加到环境变量中，当`npm run release`运行的时候，`electron-builder`会自动
帮我们上传到 github release

```
"release": "cross-env GH_TOKEN=e9780fa2016917b730babef1371b3593a58a99b5 electron-builder",
```
- 注意：token不要放在代码里一起上传到github，这是不安全的，上传之后会造成`release`发布失败

#### 应用打包，生成安装包

- `npm run pack` 本地开发，用来分析包内容时使用
- `npm run release` 打包发布，生成一个`release`版本


#### 知识点

- 拖放(Drag 与 drop) [详见](https://www.cnblogs.com/sqh17/p/8676983.html) 
[文档](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API)

```text
在拖动目标上触发事件 (源元素):
    ondragstart - 用户开始拖动元素时触发
    ondrag - 元素正在拖动时触发
    ondragend - 用户完成元素拖动后触发
释放目标时触发的事件:
    ondragenter - 当被鼠标拖动的对象进入其容器范围内时触发此事件
    ondragover - 当某被拖动的对象在另一对象容器范围内拖动时触发此事件
    ondragleave - 当被鼠标拖动的对象离开其容器范围内时触发此事件
    ondrop - 在一个拖动过程中，释放鼠标键时触发此事件
```

- Html5 通知, `Notifications API` 的通知接口用于向用户配置和显示桌面通知
[详见](https://developer.mozilla.org/zh-CN/docs/Web/API/notification)

```text
let notification = new Notification(title, options)

title
    一定会被显示的通知标题
options 可选
    一个被允许用来设置通知的对象。它包含以下属性：
    dir : 文字的方向；它的值可以是 auto（自动）, ltr（从左到右）, or rtl（从右到左）
    lang: 指定通知中所使用的语言。这个字符串必须在 BCP 47 language tag 文档中是有效的。
    body: 通知中额外显示的字符串
    tag: 赋予通知一个ID，以便在必要的时候对通知进行刷新、替换或移除。
    icon: 一个图片的URL，将被用于显示通知的图标。
```
