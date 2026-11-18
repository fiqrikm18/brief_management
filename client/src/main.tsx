import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./routers";

import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
