package com.bank.transaction_service.application;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class TransactionDataInitializer implements CommandLineRunner {

    private final LedgerEntryRepository ledgerEntryRepository;

    public TransactionDataInitializer(LedgerEntryRepository ledgerEntryRepository) {
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    @Override
    public void run(String... args) {
        if (ledgerEntryRepository.count() > 0) {
            return;
        }

        ledgerEntryRepository.saveAll(List.of(
                new LedgerEntryEntity("txn-1001", "BOOK-1001", "acc-chf-001", "lena.meyer", "DEBIT", "CARD", new BigDecimal("48.90"), "CHF", "CH66-1234-9911-0000-1000-1", "Coffee subscription", LocalDate.parse("2026-04-06"), "BOOKED"),
                new LedgerEntryEntity("txn-1002", "BOOK-1002", "acc-chf-001", "lena.meyer", "CREDIT", "SALARY", new BigDecimal("8650.00"), "CHF", "CH00-EMPLOYER-2026", "Monthly salary", LocalDate.parse("2026-04-01"), "BOOKED"),
                new LedgerEntryEntity("txn-ops-1001", "BOOK-OPS1", "acc-ops-001", "marc.steiner", "DEBIT", "FEE", new BigDecimal("0.00"), "CHF", "INTERNAL", "Internal ops monitoring entry", LocalDate.parse("2026-04-05"), "BOOKED")
        ));
    }
}
