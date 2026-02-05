import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "2m",
  thresholds: {
    http_req_failed: ["rate<0.02"],      // <2% ошибок (реальнее для цепочки)
    http_req_duration: ["p(95)<800"],    // p95 < 800ms (цепочка тяжелее)
  },
};

function login(baseUrl, email, password) {
  // ⚠️ Проверь путь: /api/auth/login (или твой)
  const url = `${baseUrl}/api/auth/login`;

  const payload = JSON.stringify({ email, password });
  const params = {
    headers: { "Content-Type": "application/json" },
    tags: { name: "POST /api/auth/login" },
  };

  const res = http.post(url, payload, params);

  check(res, {
    "login status 200/201": (r) => r.status === 200 || r.status === 201,
  });

  // ⚠️ Проверь формат ответа: token/accessToken/jwt
  // Я беру accessToken как самый частый вариант.
  const body = res.json();
  return body?.accessToken || body?.token || "";
}

export default function () {
  const baseUrl = __ENV.BASE_URL;
  const email = __ENV.TEST_EMAIL;
  const password = __ENV.TEST_PASSWORD;

  const token = login(baseUrl, email, password);

  if (!token) {
    // если токен не получен — дальше бессмысленно
    sleep(1);
    return;
  }

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // ⚠️ Проверь путь: /api/user/me (или твой)
  const me = http.get(`${baseUrl}/api/user/me`, {
    ...authHeaders,
    tags: { name: "GET /api/user/me" },
  });
  check(me, { "me is 200": (r) => r.status === 200 });

  // ⚠️ Проверь путь: /api/catalog (или твой)
  const catalog = http.get(`${baseUrl}/api/catalog`, {
    ...authHeaders,
    tags: { name: "GET /api/catalog" },
  });
  check(catalog, { "catalog is 200": (r) => r.status === 200 });

  sleep(1);
}