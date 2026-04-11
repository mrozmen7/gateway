package com.bank.transaction_service.api;

import jakarta.validation.constraints.NotBlank;

public record TransferRequest(
        @NotBlank String fromAccountId,
        @NotBlank String toIban,
        @NotBlank String amount,
        @NotBlank String currency,
        @NotBlank String description
) {
}
