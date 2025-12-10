// src/api/client.ts

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8081/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // ✅ оставляем на будущее (если появятся cookie)
    credentials: "include",
    ...options,
  });

  // пробуем вытащить текст ошибки для удобства
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}