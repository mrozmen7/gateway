package com.bank.audit_service.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    @GetMapping("/status")
    public Map<String, Object> status(@RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return Map.of(
                "service", "audit-service",
                "message", "Audit boundary is present. Persistent audit events will be added in later phases.",
                "correlationId", correlationId
        );
    }
}
