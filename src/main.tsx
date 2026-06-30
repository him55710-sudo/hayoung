if (import.meta.env.DEV) {
  const devParams = new URLSearchParams(window.location.search);
  const enableReactGrab =
    devParams.has("react-grab") || window.localStorage.getItem("hayoung-react-grab") === "1";
  const enableReactScan =
    devParams.has("react-scan") || window.localStorage.getItem("hayoung-react-scan") === "1";

  if (enableReactGrab) {
    import("react-grab");
  }

  if (enableReactScan) {
    import("react-scan").then(({ scan }) => {
      scan({ enabled: true });
    });
  }
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
