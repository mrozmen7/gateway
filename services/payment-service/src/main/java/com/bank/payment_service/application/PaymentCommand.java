package com.bank.payment_service.application;

public record PaymentCommand(
        String debtorAccountId,
        String billerName,
        String billerReference,
        String amount,
        String currency,
        String scheduleDate
) {
}
