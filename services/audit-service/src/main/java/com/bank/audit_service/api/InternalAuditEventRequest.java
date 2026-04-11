package com.bank.audit_service.api;

import com.bank.audit_service.application.AuditEventCommand;

public record InternalAuditEventRequest(
        String actorUsername,
        String actorRole,
        String eventType,
        String resource,
        String action,
        String outcome,
        String correlationId,
        String details
) {
    public AuditEventCommand toCommand() {
        return new AuditEventCommand(
                actorUsername,
                actorRole,
                eventType,
                resource,
                action,
                outcome,
                correlationId,
                details
        );
    }
}
