package com.bank.transaction_service.application;

public record TransferCommand(
        String fromAccountId,
        String toIban,
        String amount,
        String currency,
        String description
) {
}
