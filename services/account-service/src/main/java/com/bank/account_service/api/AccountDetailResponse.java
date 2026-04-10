package com.bank.account_service.api;

public record AccountDetailResponse(
        String accountId,
        String iban,
        String ownerName,
        String ownerUsername,
        String currency,
        String type,
        String status,
        String balance,
        String requestedBy,
        String correlationId
) {
}
