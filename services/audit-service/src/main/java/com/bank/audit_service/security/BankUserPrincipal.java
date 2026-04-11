package com.bank.audit_service.security;

public record BankUserPrincipal(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
