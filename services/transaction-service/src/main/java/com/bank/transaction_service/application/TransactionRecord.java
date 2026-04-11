package com.bank.transaction_service.application;

public record TransactionRecord(
        String transactionId,
        String accountId,
        String ownerUsername,
        String direction,
        String type,
        String amount,
        String currency,
        String counterpartyIban,
        String description,
        String bookingDate,
        String status
) {
}
