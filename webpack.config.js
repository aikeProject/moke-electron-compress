const baseConfig = require('./webpack.base');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');

const mainConfig = merge(baseConfig, {
    devtool: 'source-map',
    target: "electron-main",
    entry: {
        main: './src/main.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        libraryTarget: 'commonjs2'
    },
});

const renderConfig = merge(baseConfig, {
    target: "electron-renderer",
    entry: {
        renderer: './src/renderer.js',
        setting: './src/setting.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build/renderer')
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['renderer'],
            filename: 'index.html',
            template: path.join(__dirname, './src/render/index.html')
        }),
        new HtmlWebpackPlugin({
            chunks: ['setting'],
            filename: 'setting.html',
            template: path.join(__dirname, './src/render/setting.html')
        }),
    ]
});

module.exports = [mainConfig, renderConfig];
