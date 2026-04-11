package com.bank.payment_service.api;

public record PaymentCreatedResponse(
        String paymentId,
        String status,
        String requestedBy,
        String correlationId
) {
}
