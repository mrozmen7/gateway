package com.bank.payment_service.api;

public record PaymentResponse(
        String paymentId,
        String debtorAccountId,
        String billerName,
        String billerReference,
        String amount,
        String currency,
        String scheduleDate,
        String status,
        String createdAt
) {
}
