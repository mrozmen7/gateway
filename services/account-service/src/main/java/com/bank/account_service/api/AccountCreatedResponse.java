package com.bank.account_service.api;

public record AccountCreatedResponse(
        String accountId,
        String iban,
        String ownerUsername,
        String currency,
        String type,
        String status,
        String balance,
        String correlationId
) {
}
