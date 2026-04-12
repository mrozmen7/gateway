package com.bank.account_service.api;

public record PaymentDebitRequest(
        String debtorAccountId,
        String amount,
        String currency
) {
}
