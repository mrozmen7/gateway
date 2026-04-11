package com.bank.payment_service.api;

import jakarta.validation.constraints.NotBlank;

public record PaymentCreateRequest(
        @NotBlank String debtorAccountId,
        @NotBlank String billerName,
        @NotBlank String billerReference,
        @NotBlank String amount,
        @NotBlank String currency,
        @NotBlank String scheduleDate
) {
}
