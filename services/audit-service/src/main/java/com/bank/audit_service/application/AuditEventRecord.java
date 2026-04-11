package com.bank.audit_service.application;

public record AuditEventRecord(
        String eventId,
        String actorUsername,
        String actorRole,
        String eventType,
        String resource,
        String action,
        String outcome,
        String createdAt,
        String correlationId,
        String details
) {
}
