#!/bin/bash

set -euo pipefail
set +H

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8090}"

extract_json_field() {
  local json="$1"
  local key="$2"
  local marker="\"${key}\":\""
  local remainder="${json#*${marker}}"
  printf '%s\n' "${remainder%%\"*}"
}

login() {
  local username="$1"
  local password="$2"
  local response
  response=$(/usr/bin/curl -sS -X POST "${GATEWAY_URL}/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"${username}\",\"password\":\"${password}\"}")
  extract_json_field "$response" "accessToken"
}

create_account() {
  local token="$1"
  local account_type="$2"
  local opening_balance="$3"
  /usr/bin/curl -sS -X POST "${GATEWAY_URL}/api/v1/accounts" \
    -H "Authorization: Bearer ${token}" \
    -H 'Content-Type: application/json' \
    -d "{\"currency\":\"CHF\",\"type\":\"${account_type}\",\"openingBalance\":\"${opening_balance}\"}"
}

account_detail() {
  local token="$1"
  local account_id="$2"
  /usr/bin/curl -sS "${GATEWAY_URL}/api/v1/accounts/${account_id}" \
    -H "Authorization: Bearer ${token}"
}

create_transfer() {
  local token="$1"
  local idempotency_key="$2"
  local from_account_id="$3"
  local target_iban="$4"
  local amount="$5"
  /usr/bin/curl -sS -X POST "${GATEWAY_URL}/api/v1/transactions/transfers" \
    -H "Authorization: Bearer ${token}" \
    -H "Idempotency-Key: ${idempotency_key}" \
    -H 'Content-Type: application/json' \
    -d "{\"fromAccountId\":\"${from_account_id}\",\"toIban\":\"${target_iban}\",\"amount\":\"${amount}\",\"currency\":\"CHF\",\"description\":\"Phase 6 transfer smoke test\"}"
}

create_payment() {
  local token="$1"
  local idempotency_key="$2"
  local debtor_account_id="$3"
  local amount="$4"
  /usr/bin/curl -sS -X POST "${GATEWAY_URL}/api/v1/payments" \
    -H "Authorization: Bearer ${token}" \
    -H "Idempotency-Key: ${idempotency_key}" \
    -H 'Content-Type: application/json' \
    -d "{\"debtorAccountId\":\"${debtor_account_id}\",\"billerName\":\"Swisscom\",\"billerReference\":\"SMOKE-2026-001\",\"amount\":\"${amount}\",\"currency\":\"CHF\",\"scheduleDate\":\"2026-04-15\"}"
}

main() {
  local yavuz_token fatih_token
  local yavuz_checking fatih_checking fatih_savings
  local yavuz_account_id yavuz_iban fatih_account_id fatih_iban fatih_savings_id
  local before_source before_target after_source after_target after_payment
  local transfer_first transfer_second payment_first payment_second
  local transfer_first_id transfer_second_id payment_first_id payment_second_id

  yavuz_token="$(login "yavuz" "gateway!")"
  fatih_token="$(login "fatih" "gateway123!")"

  yavuz_checking="$(create_account "$yavuz_token" "CHECKING" "1200.00")"
  fatih_checking="$(create_account "$fatih_token" "CHECKING" "900.00")"
  fatih_savings="$(create_account "$fatih_token" "SAVINGS" "3000.00")"

  yavuz_account_id="$(extract_json_field "$yavuz_checking" "accountId")"
  yavuz_iban="$(extract_json_field "$yavuz_checking" "iban")"
  fatih_account_id="$(extract_json_field "$fatih_checking" "accountId")"
  fatih_iban="$(extract_json_field "$fatih_checking" "iban")"
  fatih_savings_id="$(extract_json_field "$fatih_savings" "accountId")"

  before_source="$(extract_json_field "$(account_detail "$yavuz_token" "$yavuz_account_id")" "balance")"
  before_target="$(extract_json_field "$(account_detail "$fatih_token" "$fatih_account_id")" "balance")"

  transfer_first="$(create_transfer "$yavuz_token" "idem-transfer-yavuz-fatih-001" "$yavuz_account_id" "$fatih_iban" "75.00")"
  transfer_second="$(create_transfer "$yavuz_token" "idem-transfer-yavuz-fatih-001" "$yavuz_account_id" "$fatih_iban" "75.00")"

  after_source="$(extract_json_field "$(account_detail "$yavuz_token" "$yavuz_account_id")" "balance")"
  after_target="$(extract_json_field "$(account_detail "$fatih_token" "$fatih_account_id")" "balance")"

  transfer_first_id="$(extract_json_field "$transfer_first" "transactionId")"
  transfer_second_id="$(extract_json_field "$transfer_second" "transactionId")"

  payment_first="$(create_payment "$fatih_token" "idem-payment-fatih-001" "$fatih_savings_id" "49.90")"
  payment_second="$(create_payment "$fatih_token" "idem-payment-fatih-001" "$fatih_savings_id" "49.90")"
  after_payment="$(extract_json_field "$(account_detail "$fatih_token" "$fatih_savings_id")" "balance")"

  payment_first_id="$(extract_json_field "$payment_first" "paymentId")"
  payment_second_id="$(extract_json_field "$payment_second" "paymentId")"

  printf 'YAVUZ_ACCOUNT_ID=%s\n' "$yavuz_account_id"
  printf 'YAVUZ_IBAN=%s\n' "$yavuz_iban"
  printf 'FATIH_ACCOUNT_ID=%s\n' "$fatih_account_id"
  printf 'FATIH_IBAN=%s\n' "$fatih_iban"
  printf 'TRANSFER_BEFORE_SOURCE=%s\n' "$before_source"
  printf 'TRANSFER_AFTER_SOURCE=%s\n' "$after_source"
  printf 'TRANSFER_BEFORE_TARGET=%s\n' "$before_target"
  printf 'TRANSFER_AFTER_TARGET=%s\n' "$after_target"
  printf 'TRANSFER_FIRST_ID=%s\n' "$transfer_first_id"
  printf 'TRANSFER_SECOND_ID=%s\n' "$transfer_second_id"
  printf 'PAYMENT_FIRST_ID=%s\n' "$payment_first_id"
  printf 'PAYMENT_SECOND_ID=%s\n' "$payment_second_id"
  printf 'FATIH_SAVINGS_BALANCE_AFTER_PAYMENT=%s\n' "$after_payment"
}

main "$@"
