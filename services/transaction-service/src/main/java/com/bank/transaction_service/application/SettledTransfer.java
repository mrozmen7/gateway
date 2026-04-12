package com.bank.transaction_service.application;

public record SettledTransfer(
        String sourceAccountId,
        String sourceOwnerUsername,
        String sourceIban,
        String targetAccountId,
        String targetOwnerUsername,
        String targetIban,
        String amount,
        String currency,
        String status
) {
}
