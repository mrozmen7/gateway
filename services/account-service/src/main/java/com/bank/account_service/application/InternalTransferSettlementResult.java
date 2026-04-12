package com.bank.account_service.application;

public record InternalTransferSettlementResult(
        String sourceAccountId,
        String sourceOwnerUsername,
        String sourceIban,
        String sourceBalanceAfter,
        String targetAccountId,
        String targetOwnerUsername,
        String targetIban,
        String targetBalanceAfter,
        String amount,
        String currency,
        String status
) {
}
