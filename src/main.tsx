if (import.meta.env.DEV) {
  import("react-grab");
  import("react-scan").then(({ scan }) => {
    scan({ enabled: true });
  });
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
