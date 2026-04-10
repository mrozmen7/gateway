package com.bank.account_service.api;

public record AccountSummaryResponse(
        String accountId,
        String iban,
        String currency,
        String type,
        String status,
        String balance
) {
}
