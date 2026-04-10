package com.bank.gateway.security;

public record BankUserPrincipal(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
