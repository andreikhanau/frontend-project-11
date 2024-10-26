import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: './index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),

  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/, // Match .css files
        use: ['style-loader', 'css-loader'], // Use these loaders
      },
    ],
  },
  devServer: {
    static: path.join(__dirname, 'dist'), // Serve from 'dist' folder
    compress: true, // Enable gzip compression
    port: 9000, // Port number for dev server
    open: true,
    hot: true,
    watchFiles: ['src/**/*'], // Open the browser automatically
  },
};
