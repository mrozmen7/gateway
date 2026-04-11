package com.bank.transaction_service.api;

public record TransactionSummaryResponse(
        String transactionId,
        String accountId,
        String direction,
        String type,
        String amount,
        String currency,
        String bookingDate,
        String status
) {
}
