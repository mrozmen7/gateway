package com.bank.transaction_service.application;

public record TransferResult(
        String transactionId,
        String bookingReference,
        String status,
        String amount,
        String currency
) {
}
