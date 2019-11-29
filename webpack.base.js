/**
 * @author 成雨
 * @date 2019/11/29
 * @Description:
 */

const path = require('path');
const webpack = require('webpack');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

/*
 * We've enabled HtmlWebpackPlugin for you! This generates a html
 * page for you when you compile webpack, which will make you start
 * developing and prototyping faster.
 *
 * https://github.com/jantimon/html-webpack-plugin
 *
 */

module.exports = {
    // mode: 'production',
    mode: "development",

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
                    plugins: ['syntax-dynamic-import'],

                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                modules: false
                            }
                        ]
                    ]
                }
            },
            {
                test: /\.node$/,
                use: 'node-loader',
            },
        ]
    },

    optimization: {
        splitChunks: {
            cacheGroups: {
                vendors: {
                    priority: -10,
                    test: /[\\/]node_modules[\\/]/
                }
            },
            chunks: 'async',
            minChunks: 1,
            minSize: 30000,
            name: true
        }
    }
};
