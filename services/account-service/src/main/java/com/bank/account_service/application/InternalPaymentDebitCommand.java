package com.bank.account_service.application;

public record InternalPaymentDebitCommand(
        String debtorAccountId,
        String amount,
        String currency
) {
}
