import { api } from "@/lib/api";

import type { LoginResponse } from "../types/auth";
import type { LoginFormValues } from "../schemas/auth";

export async function login(values: LoginFormValues): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", values);

  return response.data;
}
