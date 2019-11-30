/**
 * @author 成雨
 * @date 2019/11/29
 * @Description:
 */

const path = require('path');
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

const port = process.env.PORT || 3000;
// const publicPath = `http://localhost:${port}/build`;

module.exports = {
    devtool: 'source-map',
    // stats: "errors-only",

    watchOptions: {
        ignored: ['node_modules', 'dist/**/*', 'build/**/*']
    },

    plugins: [
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
                            // babel reset-env 指定处理的环境
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
    },
    devServer : {
        // publicPath,
        contentBase: path.join(__dirname, 'build'),
        port: port,
        compress: true,
        noInfo: true,
        stats: 'errors-only',
        inline: true,
        lazy: false,
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        historyApiFallback: {
            verbose: true,
            disableDotRule: false
        }
    }
};
