module.exports = {
    mode: 'development',
    entry: {
        main: './main.js'
    },


    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            loader: "babel-loader"
        }]
    },

    optimization: {
        minimize: false
    }
}