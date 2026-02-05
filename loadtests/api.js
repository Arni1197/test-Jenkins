import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],      // <1% ошибок
    http_req_duration: ['p(95)<500'],    // p95 < 500ms
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL;
  const res = http.get(`${baseUrl}/api/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}