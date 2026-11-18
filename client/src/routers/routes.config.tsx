import type { RouteObject } from "react-router";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

export const routesConfig: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <div>Login Page</div>,
      },
      {
        path: "/register",
        element: <div>Register Page</div>,
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
