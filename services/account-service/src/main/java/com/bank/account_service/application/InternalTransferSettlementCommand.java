package com.bank.account_service.application;

public record InternalTransferSettlementCommand(
        String sourceAccountId,
        String targetIban,
        String amount,
        String currency
) {
}
