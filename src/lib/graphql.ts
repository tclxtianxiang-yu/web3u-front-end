import { GraphQLClient } from "graphql-request";

// const endpoint = "https://tehxqg7ejs.us-east-2.awsapprunner.com/graphql";
const endpoint = "http://127.0.0.1:3000/graphql";

export const graphQLClient = new GraphQLClient(endpoint);

export const setAuthToken = (token: string) => {
	graphQLClient.setHeader("Authorization", `Bearer ${token}`);
};

export const removeAuthToken = () => {
	graphQLClient.setHeader("Authorization", "");
};
