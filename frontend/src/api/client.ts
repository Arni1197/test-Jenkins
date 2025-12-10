// src/api/client.ts

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8081/api";

// ✅ ВАЖНО: выкидываем стандартный body из RequestInit
type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: any; // теперь можно объект
  skipAuthRefresh?: boolean;
};

function buildBody(body: any, headers: Headers) {
  if (body == null) return undefined;

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof FormData ||
    body instanceof URLSearchParams
  ) {
    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const ct = headers.get("Content-Type") ?? "";
  if (ct.includes("application/json")) {
    return JSON.stringify(body);
  }

  return body;
}

async function rawFetch(path: string, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const body = buildBody(options.body, headers);

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body,
  });
}

function shouldSkipRefresh(path: string) {
  return (
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/forgot-password") ||
    path.startsWith("/auth/reset-password") ||
    path.startsWith("/auth/2fa/login")
  );
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const skip =
    options.skipAuthRefresh === true || shouldSkipRefresh(path);

  let res = await rawFetch(path, options);

  if (!skip && res.status === 401) {
    const refreshed = await rawFetch("/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    });

    if (refreshed.ok) {
      res = await rawFetch(path, options);
    }
  }

  if (!res.ok) {
    try {
      const data = await res.json();
      const msg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors.join(", ") : null);

      throw new Error(msg || `API error: ${res.status}`);
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(text || `API error: ${res.status}`);
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}