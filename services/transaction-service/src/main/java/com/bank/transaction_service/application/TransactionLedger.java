package com.bank.transaction_service.application;

import com.bank.transaction_service.security.BankUserPrincipal;
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
public class TransactionLedger {

    private final Map<String, List<TransactionRecord>> transactionsByUsername = new ConcurrentHashMap<>();
    private final Map<String, String> accountOwners = Map.of(
            "acc-chf-001", "lena.meyer",
            "acc-chf-002", "lena.meyer",
            "acc-ops-001", "marc.steiner"
    );

    public TransactionLedger() {
        transactionsByUsername.put("lena.meyer", new ArrayList<>(List.of(
                new TransactionRecord("txn-1001", "acc-chf-001", "lena.meyer", "DEBIT", "CARD", "48.90", "CHF", "CH66-1234-9911-0000-1000-1", "Coffee subscription", "2026-04-06", "BOOKED"),
                new TransactionRecord("txn-1002", "acc-chf-001", "lena.meyer", "CREDIT", "SALARY", "8650.00", "CHF", "CH00-EMPLOYER-2026", "Monthly salary", "2026-04-01", "BOOKED")
        )));
        transactionsByUsername.put("marc.steiner", new ArrayList<>(List.of(
                new TransactionRecord("txn-ops-1001", "acc-ops-001", "marc.steiner", "DEBIT", "FEE", "0.00", "CHF", "INTERNAL", "Internal ops monitoring entry", "2026-04-05", "BOOKED")
        )));
    }

    public List<TransactionRecord> findTransactionsFor(BankUserPrincipal principal) {
        return List.copyOf(transactionsByUsername.getOrDefault(principal.username(), List.of()));
    }

    public TransactionRecord findAuthorizedTransaction(String transactionId, BankUserPrincipal principal) {
        return transactionsByUsername.values().stream()
                .flatMap(List::stream)
                .filter(transaction -> transaction.transactionId().equals(transactionId))
                .filter(transaction -> canAccess(principal, transaction.ownerUsername()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Transaction not found"));
    }

    public TransferResult createTransfer(TransferCommand command, BankUserPrincipal principal) {
        String ownerUsername = accountOwners.get(command.fromAccountId());
        if (ownerUsername == null) {
            throw new ResponseStatusException(NOT_FOUND, "Debtor account not found");
        }

        if (!canAccess(principal, ownerUsername)) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to transfer from this account");
        }

        String transactionId = "txn-" + UUID.randomUUID().toString().substring(0, 8);
        String bookingReference = "BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        TransactionRecord record = new TransactionRecord(
                transactionId,
                command.fromAccountId(),
                ownerUsername,
                "DEBIT",
                "TRANSFER",
                command.amount(),
                command.currency(),
                command.toIban(),
                command.description(),
                LocalDate.now().toString(),
                "PENDING_SETTLEMENT"
        );

        transactionsByUsername.computeIfAbsent(ownerUsername, ignored -> new ArrayList<>()).add(0, record);

        return new TransferResult(
                transactionId,
                bookingReference,
                record.status(),
                command.amount(),
                command.currency()
        );
    }

    private boolean canAccess(BankUserPrincipal principal, String ownerUsername) {
        return "OPS".equals(principal.role()) || "AUDITOR".equals(principal.role()) || ownerUsername.equals(principal.username());
    }
}
