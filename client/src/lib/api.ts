import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

interface ApiValidationDetails {
  field: string;
  message: string;
}

interface ApiErrorBody {
  message?: string | string[];
  error?: string | { message?: string; details?: ApiValidationDetails[] };
  details?: ApiValidationDetails[];
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;

    if (body?.error && typeof body.error === "object") {
      const details = body.error.details;

      if (details && details.length > 0) {
        return details.map((detail) => detail.message).join(", ");
      }

      if (body.error.message) {
        return body.error.message;
      }
    }

    if (Array.isArray(body?.message)) {
      return body.message.join(", ");
    }

    if (typeof body?.message === "string") {
      return body.message;
    }

    if (typeof body?.error === "string") {
      return body.error;
    }

    if (error.code === "ERR_NETWORK") {
      return "Unable to reach the server. Please check your connection.";
    }

    return `Request failed with status ${error.response?.status ?? "unknown"}.`;
  }

  return "Something went wrong. Please try again.";
}
