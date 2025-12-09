const path = require("path");
const webpack = require("webpack");

const { merge } = require("webpack-merge");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const prodConfig = require("./webpack.prod");
const devConfig = require("./webpack.dev");

const isEnvProduction = process.env.NODE_ENV === "production";

const resolveApp = (relativePath) =>
	path.resolve(__dirname, "..", relativePath);

const getPublicPath = () => {
	const homePage = require(resolveApp("package.json")).homepage;

	if (process.env.NODE_ENV === "development") {
		return "";
	} else if (process.env.PUBLIC_URL) {
		return process.env.PUBLIC_URL;
	} else if (homePage) {
		return homePage;
	}
	return "/";
};

const getEnvVariables = () => ({
	PUBLIC_URL: getPublicPath(),
	VERSION: require(resolveApp("package.json")).version,
});

const commonConfig = {
	entry: "./src/index.tsx",
	output: {
		filename: "[name].bundle.js",
		clean: true,
		publicPath: "/",
	},
	plugins: [
		new webpack.ProgressPlugin(),
		new HtmlWebpackPlugin({
			inject: true,
			template: resolveApp("public/index.html"),
			...getEnvVariables(),
		}),
		new MiniCssExtractPlugin({ filename: "[name].bundle.css" }),
		new webpack.DefinePlugin({
			// 注入可在 Cloudflare Pages 设置的 API_URL 环境变量
			"process.env.API_URL": JSON.stringify(process.env.API_URL || ""),
		}),
	],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				loader: "swc-loader",
				include: [resolveApp("src")],
				exclude: [/node_modules/],
			},
			{
				test: /\.css$/,
				sideEffects: true,
				use: [
					isEnvProduction
						? {
								loader: MiniCssExtractPlugin.loader,
							}
						: "style-loader",
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
						},
					},
					{
						loader: "postcss-loader",
						options: {
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				type: "asset/resource",
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
		alias: {
			pages: resolveApp("src/pages"),
			components: resolveApp("src/components"),
			hooks: resolveApp("src/hooks"),
			router: resolveApp("src/router"),
			utils: resolveApp("src/utils"),
			lib: resolveApp("src/lib"),
		},
		fallback: {
			"@base-org/account": false,
			"@coinbase/wallet-sdk": false,
			"@gemini-wallet/core": false,
			porto: false,
			"porto/internal": false,
			"@safe-global/safe-apps-sdk": false,
			"@safe-global/safe-apps-provider": false,
			"@react-native-async-storage/async-storage": false,
		},
	},
};

module.exports = merge(commonConfig, isEnvProduction ? prodConfig : devConfig);
