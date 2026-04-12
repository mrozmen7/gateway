package com.bank.account_service.api;

public record TransferSettlementRequest(
        String sourceAccountId,
        String targetIban,
        String amount,
        String currency
) {
}
