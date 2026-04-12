package com.bank.transaction_service.application;

import com.bank.transaction_service.security.BankUserPrincipal;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TransactionLedger {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final TransferIdempotencyRepository transferIdempotencyRepository;

    public TransactionLedger(LedgerEntryRepository ledgerEntryRepository, TransferIdempotencyRepository transferIdempotencyRepository) {
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.transferIdempotencyRepository = transferIdempotencyRepository;
    }

    public List<TransactionRecord> findTransactionsFor(BankUserPrincipal principal) {
        return ledgerEntryRepository.findByOwnerUsernameOrderByIdDesc(principal.username()).stream()
                .map(this::toRecord)
                .toList();
    }

    public TransactionRecord findAuthorizedTransaction(String transactionId, BankUserPrincipal principal) {
        return lookupAuthorizedEntity(transactionId, principal)
                .map(this::toRecord)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Transaction not found"));
    }

    public TransferResult findIdempotentTransfer(String requesterUsername, String idempotencyKey) {
        return transferIdempotencyRepository.findByRequesterUsernameAndIdempotencyKey(requesterUsername, idempotencyKey)
                .map(entity -> new TransferResult(
                        entity.getTransactionId(),
                        entity.getBookingReference(),
                        entity.getStatus(),
                        formatAmount(entity.getAmount()),
                        entity.getCurrency()
                ))
                .orElse(null);
    }

    @Transactional
    public TransferResult createTransfer(SettledTransfer settledTransfer, String description) {
        String transactionId = "txn-" + UUID.randomUUID().toString().substring(0, 8);
        String bookingReference = "BOOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal amount = parseAmount(settledTransfer.amount());

        ledgerEntryRepository.saveAll(List.of(
                new LedgerEntryEntity(
                        transactionId,
                        bookingReference,
                        settledTransfer.sourceAccountId(),
                        settledTransfer.sourceOwnerUsername(),
                        "DEBIT",
                        "TRANSFER",
                        amount,
                        settledTransfer.currency(),
                        settledTransfer.targetIban(),
                        description,
                        LocalDate.now(),
                        settledTransfer.status()
                ),
                new LedgerEntryEntity(
                        transactionId,
                        bookingReference,
                        settledTransfer.targetAccountId(),
                        settledTransfer.targetOwnerUsername(),
                        "CREDIT",
                        "TRANSFER",
                        amount,
                        settledTransfer.currency(),
                        settledTransfer.sourceIban(),
                        description,
                        LocalDate.now(),
                        settledTransfer.status()
                )
        ));

        return new TransferResult(
                transactionId,
                bookingReference,
                settledTransfer.status(),
                settledTransfer.amount(),
                settledTransfer.currency()
        );
    }

    @Transactional
    public void rememberIdempotentTransfer(String requesterUsername, String idempotencyKey, TransferResult result, String correlationId) {
        transferIdempotencyRepository.save(new TransferIdempotencyEntity(
                requesterUsername,
                idempotencyKey,
                result.transactionId(),
                result.bookingReference(),
                result.status(),
                parseAmount(result.amount()),
                result.currency(),
                correlationId
        ));
    }

    private java.util.Optional<LedgerEntryEntity> lookupAuthorizedEntity(String transactionId, BankUserPrincipal principal) {
        if ("OPS".equals(principal.role()) || "AUDITOR".equals(principal.role())) {
            return ledgerEntryRepository.findFirstByTransactionIdOrderByIdAsc(transactionId);
        }

        return ledgerEntryRepository.findFirstByTransactionIdAndOwnerUsernameOrderByIdAsc(transactionId, principal.username());
    }

    private boolean canAccess(BankUserPrincipal principal, String ownerUsername) {
        return "OPS".equals(principal.role()) || "AUDITOR".equals(principal.role()) || ownerUsername.equals(principal.username());
    }

    private TransactionRecord toRecord(LedgerEntryEntity entity) {
        return new TransactionRecord(
                entity.getTransactionId(),
                entity.getAccountId(),
                entity.getOwnerUsername(),
                entity.getDirection(),
                entity.getType(),
                formatAmount(entity.getAmount()),
                entity.getCurrency(),
                entity.getCounterpartyIban(),
                entity.getDescription(),
                entity.getBookingDate().toString(),
                entity.getStatus()
        );
    }

    private BigDecimal parseAmount(String amount) {
        return new BigDecimal(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
