var webpack = require('webpack');  
module.exports = {  
    entry: {
      app: "./Content/app.js"
    },
    output: {
        path: __dirname + '/wwwroot',
        filename: "[name].bundle.js"
    },
    module: {
        loaders: [
            { test: /\.js?$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
            { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
            { test: /\.css$/, loader: "style!css" }
        ]
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ]

};
