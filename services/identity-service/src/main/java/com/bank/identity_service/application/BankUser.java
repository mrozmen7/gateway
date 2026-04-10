package com.bank.identity_service.application;

public record BankUser(
        String userId,
        String username,
        String passwordHash,
        String role,
        String fullName
) {
}
