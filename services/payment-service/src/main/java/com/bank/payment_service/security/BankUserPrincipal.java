package com.bank.payment_service.security;

public record BankUserPrincipal(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
