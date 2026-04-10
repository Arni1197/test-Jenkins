#!/usr/bin/env bash

set -euo pipefail

DATABASE_URL="${1:-}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "Usage: $0 <DATABASE_URL>"
  echo 'Example: $0 "postgresql://user:pass@host:5432/app_db?schema=public"'
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is not installed or not in PATH"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is not installed or not in PATH"
  exit 1
fi

PARSED="$(
python3 - <<'PY' "${DATABASE_URL}"
import sys
from urllib.parse import urlparse

url = sys.argv[1]
p = urlparse(url)

host = p.hostname or ""
port = p.port or 5432
dbname = (p.path or "").lstrip("/")
user = p.username or ""

print(host)
print(port)
print(dbname)
print(user)
PY
)"

DB_HOST="$(echo "${PARSED}" | sed -n '1p')"
DB_PORT="$(echo "${PARSED}" | sed -n '2p')"
DB_NAME="$(echo "${PARSED}" | sed -n '3p')"
DB_USER="$(echo "${PARSED}" | sed -n '4p')"

echo "=================================================="
echo "POSTGRES CHECK"
echo "=================================================="
echo "Host: ${DB_HOST}"
echo "Port: ${DB_PORT}"
echo "Database: ${DB_NAME}"
echo "User: ${DB_USER}"
echo

echo ">>> 1. TCP CONNECTIVITY CHECK"
if python3 - <<'PY' "${DB_HOST}" "${DB_PORT}"
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

s = socket.socket()
s.settimeout(5)
try:
    s.connect((host, port))
    print("✅ TCP connection successful")
    s.close()
    sys.exit(0)
except Exception as e:
    print(f"❌ TCP connection failed: {e}")
    sys.exit(1)
PY
then
  :
else
  echo
  echo "VERDICT: DB is not reachable on TCP level"
  exit 2
fi
echo

echo ">>> 2. SIMPLE SQL CHECK (select 1)"
if psql "${DATABASE_URL}" -tAc "select 1;" >/dev/null 2>&1; then
  echo "✅ SQL query successful"
else
  echo "❌ SQL query failed"
  echo
  echo "VERDICT: TCP is reachable, but SQL/auth/query failed"
  exit 3
fi
echo

echo ">>> 3. BASIC DB INFO"
psql "${DATABASE_URL}" -x -c "
select
  current_database() as current_database,
  current_user as current_user,
  now() as server_time,
  version() as postgres_version;
"
echo

echo ">>> 4. CONNECTION COUNT"
psql "${DATABASE_URL}" -x -c "
select count(*) as total_connections
from pg_stat_activity;
"
echo

echo ">>> 5. QUICK WRITE CHECK"
psql "${DATABASE_URL}" -x -c "
begin;
create temporary table if not exists _db_check_tmp(id int);
insert into _db_check_tmp values (1);
select count(*) as temp_rows from _db_check_tmp;
rollback;
"
echo

echo "=================================================="
echo "✅ VERDICT: DB looks reachable and operational"
echo "=================================================="