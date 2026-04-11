#!/bin/zsh

set -euo pipefail

BASE_URL="${1:-http://localhost:8090}"

echo "== Phase 5 smoke test =="
echo "Gateway: ${BASE_URL}"

LOGIN_RESPONSE=$(/usr/bin/curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"lena.meyer","password":"SecurePass123"}')

TOKEN=$(printf '%s' "${LOGIN_RESPONSE}" | /usr/bin/python3 -c 'import sys, json; print(json.load(sys.stdin)["accessToken"])')

echo
echo "-- Login response --"
printf '%s\n' "${LOGIN_RESPONSE}"

echo
echo "-- Transfer create --"
/usr/bin/curl -s -X POST "${BASE_URL}/api/v1/transactions/transfers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"fromAccountId":"acc-chf-001","toIban":"CH11-2222-3333-4444-5555-6","amount":"250.00","currency":"CHF","description":"Rent top-up"}'
echo

echo
echo "-- Payment create --"
/usr/bin/curl -s -X POST "${BASE_URL}/api/v1/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"debtorAccountId":"acc-chf-001","billerName":"Swissgrid","billerReference":"BILL-2026-991","amount":"89.50","currency":"CHF","scheduleDate":"2026-04-14"}'
echo

echo
echo "-- Transactions me --"
/usr/bin/curl -s "${BASE_URL}/api/v1/transactions/me" \
  -H "Authorization: Bearer ${TOKEN}"
echo

echo
echo "-- Payments me --"
/usr/bin/curl -s "${BASE_URL}/api/v1/payments/me" \
  -H "Authorization: Bearer ${TOKEN}"
echo

echo
echo "-- Audit events me --"
/usr/bin/curl -s "${BASE_URL}/api/v1/audit/events/me" \
  -H "Authorization: Bearer ${TOKEN}"
echo
