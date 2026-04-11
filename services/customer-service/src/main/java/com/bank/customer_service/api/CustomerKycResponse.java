package com.bank.customer_service.api;

public record CustomerKycResponse(
        String userId,
        String username,
        String kycStatus,
        String kycLevel,
        String riskRating
) {
}
