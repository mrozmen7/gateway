package com.bank.identity_service.api;

public record CurrentUserResponse(
        String userId,
        String username,
        String role,
        String tokenId
) {
}
