package com.bank.account_service.api;

public record AccountVerificationResponse(
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
