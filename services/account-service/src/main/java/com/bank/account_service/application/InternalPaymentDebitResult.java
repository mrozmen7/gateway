package com.bank.account_service.application;

public record InternalPaymentDebitResult(
        String debtorAccountId,
        String ownerUsername,
        String ownerName,
        String balanceAfter,
        String amount,
        String currency,
        String status
) {
}
