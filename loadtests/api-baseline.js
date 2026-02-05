import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 25,
  duration: "3m",
  thresholds: {
    http_req_failed: ["rate<0.01"],      // <1% ошибок
    http_req_duration: ["p(95)<250"],    // p95 < 250ms (для /health обычно реально)
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL;

  const res = http.get(`${baseUrl}/api/health`, {
    tags: { name: "GET /api/health" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(0.2); // чуть плотнее, чем smoke
}