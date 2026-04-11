package com.bank.customer_service.security;

public record BankUserPrincipal(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
