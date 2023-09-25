import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./index.less";
import { Router } from "./route";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
