import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "@/utils/token";

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  request_id?: string;
};

export class ApiError extends Error {
  code?: number;
  status?: number;
  requestId?: string;

  constructor(message: string, opts?: { code?: number; status?: number; requestId?: string }) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.status = opts?.status;
    this.requestId = opts?.requestId;
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return !!value && typeof value === "object" && "code" in value && "message" in value && "data" in value;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api/v1",
  timeout: 15_000
});

http.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  // backend accepts an optional X-Request-Id for tracing
  (config.headers as Record<string, string>)["X-Request-Id"] = `admin-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

  const token = getToken();
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (resp) => {
    const body = resp.data as unknown;
    if (isApiResponse(body)) {
      if (body.code !== 0) {
        throw new ApiError(body.message || "请求失败", { code: body.code, status: resp.status, requestId: body.request_id });
      }
      return body.data;
    }
    return body;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as unknown;
    const message =
      (typeof data === "object" && data && "detail" in data && String((data as any).detail)) ||
      (isApiResponse(data) && data.message) ||
      error.message ||
      "网络错误";

    if (status === 401) {
      clearToken();
      // Avoid hard-coupling to router to keep modules simple.
      if (location.pathname !== "/login") {
        location.replace(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      }
    }

    throw new ApiError(message, { status, requestId: isApiResponse(data) ? data.request_id : undefined });
  }
);

