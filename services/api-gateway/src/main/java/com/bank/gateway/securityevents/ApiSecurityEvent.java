package com.bank.gateway.securityevents;

public record ApiSecurityEvent(
        String eventId,
        String timestamp,
        String correlationId,
        String userId,
        String username,
        String role,
        String ipAddress,
        String userAgent,
        String endpoint,
        String httpMethod,
        int statusCode,
        long responseTimeMs,
        String serviceName
) {
}
