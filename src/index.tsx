import ReactDOM from "react-dom/client";
import App from "./pages/App";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

const rootElement = document.querySelector("#root");
if (!rootElement) {
	throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
