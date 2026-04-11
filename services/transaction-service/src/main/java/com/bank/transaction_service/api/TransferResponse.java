package com.bank.transaction_service.api;

public record TransferResponse(
        String transactionId,
        String bookingReference,
        String status,
        String amount,
        String currency,
        String requestedBy,
        String correlationId
) {
}
