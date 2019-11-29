/**
 * @author 成雨
 * @date 2019/11/27
 * @Description:
 */

const {app, ipcMain} = require('electron');
const dev = require('electron-is-dev');
const AppWindow = require('./AppWindow');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow, settingsWindow;

const createWindow = () => {
    // Create the browser window.

    const mainUrl = dev
        ? `file://${path.join(__dirname, './render/index.html')}`
        : `file://${path.join(__dirname, '../renderer/render/index.html')}`;

    mainWindow = new AppWindow({
        // width: 300,
        // height: 600,
    }, mainUrl);

    // Open the DevTools.
    dev && mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        };
        const settingsFileLocation = dev
            ? `file://${path.join(__dirname, '../renderer/render/setting.html')}`
            : `file://${path.join(__dirname, './render/setting.html')}`;

        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
        settingsWindow.removeMenu();

        settingsWindow.on('closed', () => {
            settingsWindow = null
        });
    });

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('settings', (event, args) => {
    mainWindow.webContents.send('settings', args)
});
