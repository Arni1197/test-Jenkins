import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL;
const EMAIL = __ENV.TEST_USER_EMAIL;
const PASSWORD = __ENV.TEST_USER_PASSWORD;
const PRODUCT_ID = __ENV.PRODUCT_ID || 'prod-mechanical-keyboard-k8';

export const options = {
  vus: 1,
  iterations: 1,
  insecureSkipTLSVerify: true,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
};

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
}

function buildCookieHeader(res) {
  const cookies = res.cookies || {};
  const jwt = cookies.jwt && cookies.jwt.length > 0 ? cookies.jwt[0].value : null;
  const refreshJwt =
    cookies.refreshJwt && cookies.refreshJwt.length > 0
      ? cookies.refreshJwt[0].value
      : null;

  if (!jwt) {
    throw new Error('JWT cookie not found in login response');
  }

  let cookieHeader = `jwt=${jwt}`;
  if (refreshJwt) {
    cookieHeader += `; refreshJwt=${refreshJwt}`;
  }

  return cookieHeader;
}

requireEnv('BASE_URL', BASE_URL);
requireEnv('TEST_USER_EMAIL', EMAIL);
requireEnv('TEST_USER_PASSWORD', PASSWORD);

export default function () {
  let authParams;

  group('login', () => {
    const loginPayload = JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    });

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const ok = check(loginRes, {
      'login status is 201': (r) => r.status === 201,
      'login has jwt cookie': (r) =>
        r.cookies && r.cookies.jwt && r.cookies.jwt.length > 0,
    });

    if (!ok) {
      throw new Error(`Login failed. Status=${loginRes.status}. Body=${loginRes.body}`);
    }

    const cookieHeader = buildCookieHeader(loginRes);

    authParams = {
      headers: {
        Cookie: cookieHeader,
      },
    };
  });

  group('auth me', () => {
    const meRes = http.get(`${BASE_URL}/api/auth/me`, authParams);

    const ok = check(meRes, {
      'auth/me status is 200': (r) => r.status === 200,
      'auth/me contains user email': (r) => r.body.includes(EMAIL),
    });

    if (!ok) {
      throw new Error(`GET /api/auth/me failed. Status=${meRes.status}. Body=${meRes.body}`);
    }
  });

  group('catalog products', () => {
    const productsRes = http.get(`${BASE_URL}/api/catalog/products`, authParams);

    const ok = check(productsRes, {
      'catalog/products status is 200': (r) => r.status === 200,
      'catalog/products contains product id': (r) => r.body.includes(PRODUCT_ID),
    });

    if (!ok) {
      throw new Error(
        `GET /api/catalog/products failed. Status=${productsRes.status}. Body=${productsRes.body}`,
      );
    }
  });
}