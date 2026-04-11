package com.bank.audit_service.api;

import com.bank.audit_service.application.AuditEventRecord;
import com.bank.audit_service.application.AuditEventStore;
import com.bank.audit_service.security.BankUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditEventStore auditEventStore;

    public AuditController(AuditEventStore auditEventStore) {
        this.auditEventStore = auditEventStore;
    }

    @GetMapping("/events/me")
    @Operation(summary = "Return audit events visible to the authenticated user")
    public List<AuditEventResponse> myAuditEvents(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return auditEventStore.findEventsFor(principal).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/events/security")
    @Operation(summary = "Return the security audit feed for OPS and AUDITOR roles")
    public List<AuditEventResponse> securityEvents(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return auditEventStore.findSecurityEvents(principal).stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditEventResponse toResponse(AuditEventRecord event) {
        return new AuditEventResponse(
                event.eventId(),
                event.actorUsername(),
                event.actorRole(),
                event.eventType(),
                event.resource(),
                event.action(),
                event.outcome(),
                event.createdAt(),
                event.correlationId(),
                event.details()
        );
    }
}
