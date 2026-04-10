package com.bank.account_service.application;

public record AccountRecord(
        String accountId,
        String iban,
        String ownerUserId,
        String ownerUsername,
        String ownerName,
        String currency,
        String type,
        String status,
        String balance
) {
}
