import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./index.less";
import { Router } from "./route";
import { WizzProvider } from "./services/hooks";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WizzProvider>
      <Router />
    </WizzProvider>
  </React.StrictMode>
);
