package com.bank.audit_service.application;

import com.bank.audit_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class AuditEventStore {

    private final List<AuditEventRecord> events = List.of(
            new AuditEventRecord("aud-1001", "lena.meyer", "CUSTOMER", "LOGIN", "identity-service", "AUTHENTICATE", "SUCCESS", "2026-04-10T09:12:01Z", "corr-login-1001", "Customer login completed"),
            new AuditEventRecord("aud-1002", "lena.meyer", "CUSTOMER", "ACCOUNT_ACCESS", "account-service", "READ_ACCOUNTS", "SUCCESS", "2026-04-10T09:12:08Z", "corr-accounts-1001", "Customer read own accounts"),
            new AuditEventRecord("aud-1003", "marc.steiner", "OPS", "PAYMENT_REVIEW", "payment-service", "READ_PAYMENT", "SUCCESS", "2026-04-10T10:41:17Z", "corr-pay-2001", "Operations review for scheduled payment"),
            new AuditEventRecord("aud-1004", "audrey.keller", "AUDITOR", "SECURITY_REVIEW", "gateway", "READ_SECURITY_EVENTS", "SUCCESS", "2026-04-10T13:22:44Z", "corr-sec-3001", "Auditor reviewed security feed")
    );

    public List<AuditEventRecord> findEventsFor(BankUserPrincipal principal) {
        return events.stream()
                .filter(event -> event.actorUsername().equals(principal.username()) || canSeeSecurityFeed(principal))
                .toList();
    }

    public List<AuditEventRecord> findSecurityEvents(BankUserPrincipal principal) {
        if (!canSeeSecurityFeed(principal)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to access the security audit feed");
        }

        return events.stream()
                .filter(event -> "LOGIN".equals(event.eventType()) || "SECURITY_REVIEW".equals(event.eventType()))
                .toList();
    }

    private boolean canSeeSecurityFeed(BankUserPrincipal principal) {
        return "OPS".equals(principal.role()) || "AUDITOR".equals(principal.role());
    }
}
