var path = require("path");

module.exports = {
	mode: "development",
	devtool: "inline-source-map",
	devServer: {
		static: {
			directory: path.resolve(__dirname, "..", "dist"),
		},
		port: 4200,
		open: true,
		hot: true,
		compress: true,
		historyApiFallback: true,
	},
	optimization: {
		minimize: false,
	},
};
