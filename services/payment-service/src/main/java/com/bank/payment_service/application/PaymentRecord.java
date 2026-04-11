package com.bank.payment_service.application;

public record PaymentRecord(
        String paymentId,
        String debtorAccountId,
        String ownerUsername,
        String billerName,
        String billerReference,
        String amount,
        String currency,
        String scheduleDate,
        String status,
        String createdAt
) {
}
