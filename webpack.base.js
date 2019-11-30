/**
 * @author 成雨
 * @date 2019/11/29
 * @Description:
 */

const path = require('path');
const webpack = require('webpack');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
    devtool: 'source-map',

    watchOptions: {
        ignored: /node_modules/
    },

    plugins: [
        new webpack.ProgressPlugin(),
        new FilterWarningsPlugin({
            exclude: /Critical dependency: the request of a dependency is an expression/,
        })
    ],

    module: {
        rules: [
            {
                test: /.(js|jsx)$/,
                include: [path.resolve(__dirname, 'src')],
                loader: 'babel-loader',

                options: {
                    cacheDirectory: true,

                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                targets: {
                                    electron: require('electron/package.json').version
                                }
                            }
                        ]
                    ]
                }
            },
            {
                test: /\.node$/,
                use: 'node-loader',
            },
            {
                test: /\.(css|less)/,
                use: [
                    {loader: "style-loader"},
                    {loader: "css-loader"},
                    {loader: "less-loader"}
                ]
            }
        ]
    },

    node: {
        __dirname: false,
        __filename: false
    }
};
