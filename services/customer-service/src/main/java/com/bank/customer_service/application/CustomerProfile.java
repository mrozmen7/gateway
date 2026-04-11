package com.bank.customer_service.application;

public record CustomerProfile(
        String userId,
        String username,
        String fullName,
        String segment,
        String residencyCountry,
        String preferredLanguage,
        String email,
        String phone,
        String relationshipSince,
        String riskRating,
        String kycStatus,
        String kycLevel
) {
}
