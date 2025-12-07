import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";
import { WagmiProvider } from "wagmi";
import { ThemeProvider } from "../components/theme-provider";
import router from "../router";
import { config } from "../wallet/config";
import { Toaster } from "../components/ui/toaster";
import { AuthProvider } from "../contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
					<RainbowKitProvider>
                        <AuthProvider>
						    <RouterProvider router={router}></RouterProvider>
						    <Toaster />
                        </AuthProvider>
					</RainbowKitProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};

export default App;
