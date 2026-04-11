package com.bank.customer_service.api;

public record CustomerProfileResponse(
        String userId,
        String username,
        String fullName,
        String segment,
        String residencyCountry,
        String preferredLanguage,
        String email,
        String phone,
        String relationshipSince,
        String riskRating
) {
}
