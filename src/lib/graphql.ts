import { GraphQLClient } from "graphql-request";

// 可通过环境变量 API_URL 注入后端地址（Cloudflare Pages 等），默认本地
const endpoint =
	process.env.API_URL && process.env.API_URL.trim().length > 0
		? process.env.API_URL
		: "http://127.0.0.1:3000/graphql";

export const graphQLClient = new GraphQLClient(endpoint);

export const setAuthToken = (token: string) => {
	graphQLClient.setHeader("Authorization", `Bearer ${token}`);
};

export const removeAuthToken = () => {
	graphQLClient.setHeader("Authorization", "");
};
