package com.bank.customer_service.api;

public record CustomerEligibilityResponse(
        String userId,
        String username,
        String fullName,
        String segment,
        String kycStatus,
        String kycLevel,
        String riskRating
) {
}
