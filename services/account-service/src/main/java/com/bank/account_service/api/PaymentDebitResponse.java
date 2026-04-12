package com.bank.account_service.api;

public record PaymentDebitResponse(
        String debtorAccountId,
        String ownerUsername,
        String ownerName,
        String balanceAfter,
        String amount,
        String currency,
        String status
) {
}
