// src/api/client.ts

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8081/api";

/**
 * Базовый fetch с JSON + cookies
 */
async function rawFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include", // ✅ важно для cookie jwt/refreshJwt
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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
  options: RequestInit = {}
): Promise<T> {
  let res = await rawFetch(path, options);

  if (res.status === 401) {
    const refreshed = await rawFetch("/auth/refresh", {
      method: "POST",
    });

    if (refreshed.ok) {
      res = await rawFetch(path, options);
    }
  }

  if (!res.ok) {
    // попробуем вытащить сообщение сервера
    const text = await res.text().catch(() => "");
    throw new Error(text || `API error: ${res.status}`);
  }

  // на случай 204
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}