import type { RouteObject } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { CreateBriefPage } from "../features/brief/pages/CreateBriefPage";
import { LoginPage } from "../features/authentication/pages/LoginPage";
import { DashboardPage } from "../features/brief/pages/DashboardPage";

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
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
    ],
  },
];
