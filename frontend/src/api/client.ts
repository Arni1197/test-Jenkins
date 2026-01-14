// src/api/client.ts
const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8081/api";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: any;
  skipAuthRefresh?: boolean;
};

function isBodyInitLike(v: any) {
  if (v == null) return false;
  if (typeof v === "string") return true;
  if (v instanceof Blob) return true;
  if (v instanceof ArrayBuffer) return true;
  if (v instanceof FormData) return true;
  if (v instanceof URLSearchParams) return true;
  return false;
}

function normalizeBody(body: any) {
  if (body == null) return undefined;
  if (isBodyInitLike(body)) return body;
  return JSON.stringify(body);
}

/**
 * Низкоуровневый fetch с cookies
 */
async function rawFetch(path: string, options: ApiFetchOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const body = normalizeBody(options.body);

  // если body НЕ BodyInitLike (т.е. JSON-объект) — гарантируем Content-Type
  if (body !== undefined && !isBodyInitLike(options.body)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    ...options,
    headers,
    body,
  });
}

/**
 * Универсальный клиент:
 * - делает запрос
 * - если 401 → пытается refresh
 * - если refresh OK → повторяет исходный запрос
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  let res = await rawFetch(path, options);

  const shouldTryRefresh = !options.skipAuthRefresh && path !== "/auth/refresh";

  if (res.status === 401 && shouldTryRefresh) {
    const refreshed = await rawFetch("/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    });

    if (refreshed.ok) {
      res = await rawFetch(path, options);
    }
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    // ✅ если сервер вернул JSON — покажем message
    try {
      const data = JSON.parse(raw);
      throw new Error(data?.message || raw || `API error: ${res.status}`);
    } catch {
      throw new Error(raw || `API error: ${res.status}`);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}