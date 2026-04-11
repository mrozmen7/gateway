package com.bank.transaction_service.api;

public record TransactionDetailResponse(
        String transactionId,
        String accountId,
        String direction,
        String type,
        String amount,
        String currency,
        String counterpartyIban,
        String description,
        String bookingDate,
        String status,
        String requestedBy
) {
}
