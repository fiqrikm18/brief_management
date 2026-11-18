import type { RouteObject } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { CreateBriefPage } from "../features/brief/pages/CreateBriefPage";

export const routesConfig: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <CreateBriefPage />,
      },
      {
        path: "/login",
        element: <div>Login Page</div>,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <div>Dashboard Page</div>,
      },
    ],
  },
];
