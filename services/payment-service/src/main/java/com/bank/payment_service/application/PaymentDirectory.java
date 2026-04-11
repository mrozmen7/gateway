package com.bank.payment_service.application;

import com.bank.payment_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PaymentDirectory {

    private final Map<String, List<PaymentRecord>> paymentsByUsername = new ConcurrentHashMap<>();
    private final Map<String, String> accountOwners = Map.of(
            "acc-chf-001", "lena.meyer",
            "acc-chf-002", "lena.meyer",
            "acc-ops-001", "marc.steiner"
    );

    public PaymentDirectory() {
        paymentsByUsername.put("lena.meyer", new ArrayList<>(List.of(
                new PaymentRecord("pay-1001", "acc-chf-001", "lena.meyer", "Swisscom", "INV-2026-7781", "129.90", "CHF", "2026-04-12", "SCHEDULED", "2026-04-09"),
                new PaymentRecord("pay-1002", "acc-chf-002", "lena.meyer", "ZVV", "ABO-2026-04", "87.00", "CHF", "2026-04-02", "BOOKED", "2026-03-30")
        )));
    }

    public List<PaymentRecord> findPaymentsFor(BankUserPrincipal principal) {
        return List.copyOf(paymentsByUsername.getOrDefault(principal.username(), List.of()));
    }

    public PaymentRecord findAuthorizedPayment(String paymentId, BankUserPrincipal principal) {
        return paymentsByUsername.values().stream()
                .flatMap(List::stream)
                .filter(payment -> payment.paymentId().equals(paymentId))
                .filter(payment -> canAccess(principal, payment.ownerUsername()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Payment not found"));
    }

    public PaymentRecord createPayment(PaymentCommand command, BankUserPrincipal principal) {
        String ownerUsername = accountOwners.get(command.debtorAccountId());
        if (ownerUsername == null) {
            throw new ResponseStatusException(NOT_FOUND, "Debtor account not found");
        }

        if (!canAccess(principal, ownerUsername)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to create a payment from this account");
        }

        PaymentRecord payment = new PaymentRecord(
                "pay-" + UUID.randomUUID().toString().substring(0, 8),
                command.debtorAccountId(),
                ownerUsername,
                command.billerName(),
                command.billerReference(),
                command.amount(),
                command.currency(),
                command.scheduleDate(),
                "SUBMITTED",
                LocalDate.now().toString()
        );

        paymentsByUsername.computeIfAbsent(ownerUsername, ignored -> new ArrayList<>()).add(0, payment);
        return payment;
    }

    private boolean canAccess(BankUserPrincipal principal, String ownerUsername) {
        return "OPS".equals(principal.role()) || "AUDITOR".equals(principal.role()) || ownerUsername.equals(principal.username());
    }
}
