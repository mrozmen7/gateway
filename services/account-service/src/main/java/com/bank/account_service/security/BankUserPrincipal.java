package com.bank.account_service.security;

public record BankUserPrincipal(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
