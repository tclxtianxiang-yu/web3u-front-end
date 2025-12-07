import { getDefaultConfig } from "@rainbow-me/rainbowkit";

import { mainnet, sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
	appName: "Web3 University",
	projectId: "fd195d525f270e2e1d60ca4ce50c9fc4",
	chains: [mainnet, sepolia],
	ssr: false,
});
