package com.bank.account_service.api;

import jakarta.validation.constraints.NotBlank;

public record CreateAccountRequest(
        @NotBlank String currency,
        @NotBlank String type,
        @NotBlank String openingBalance
) {
}
