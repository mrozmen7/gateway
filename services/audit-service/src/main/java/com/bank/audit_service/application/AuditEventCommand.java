package com.bank.audit_service.application;

public record AuditEventCommand(
        String actorUsername,
        String actorRole,
        String eventType,
        String resource,
        String action,
        String outcome,
        String correlationId,
        String details
) {
}
