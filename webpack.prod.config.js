const path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        home: './src/home.js',
        apply: './src/apply.js',
        main: './src/grayscale.js',
        manage: './src/manage.js'
    },
    output: {
        filename: '[name].bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // you can specify a publicPath here
                            // by default it uses publicPath in webpackOptions.output
                            publicPath: '../',
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader',
                ],
            }, {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
           /* {
                test: /\.(html)$/,
                use: ['file-loader?name=[name].[ext]', 'extract-loader', 'html-loader'],
            }*/
        ]
    },
    plugins: [new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].css',
        }),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "src/index.html",
            chunks: ['main']
        }),
        new HtmlWebpackPlugin({
            filename: "addons.html",
            template: "src/addons.html",
            chunks: []
        }),
        new HtmlWebpackPlugin({
            filename: "apply.html",
            template: "src/apply.html",
            chunks:['apply']
        }),
        new HtmlWebpackPlugin({
            filename: "home.html",
            template: "src/home.html",
            excludeChunks: ['main', 'apply']
        }),new CopyPlugin([
            { from: 'src/templates' }
        ])]

};