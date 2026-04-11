package com.bank.audit_service.api;

import com.bank.audit_service.application.AuditEventStore;
import com.bank.audit_service.security.InternalApiKeyValidator;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/internal/audit")
public class InternalAuditController {

    private final AuditEventStore auditEventStore;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public InternalAuditController(AuditEventStore auditEventStore, InternalApiKeyValidator internalApiKeyValidator) {
        this.auditEventStore = auditEventStore;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void recordEvent(
            @RequestHeader("X-Internal-Api-Key") String internalApiKey,
            @RequestBody InternalAuditEventRequest request
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        auditEventStore.recordEvent(request.toCommand());
    }
}
