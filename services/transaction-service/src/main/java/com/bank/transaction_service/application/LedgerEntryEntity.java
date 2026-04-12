package com.bank.transaction_service.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "ledger_entries")
public class LedgerEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String transactionId;

    @Column(nullable = false)
    private String bookingReference;

    @Column(nullable = false)
    private String accountId;

    @Column(nullable = false)
    private String ownerUsername;

    @Column(nullable = false)
    private String direction;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String counterpartyIban;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private LocalDate bookingDate;

    @Column(nullable = false)
    private String status;

    protected LedgerEntryEntity() {
    }

    public LedgerEntryEntity(
            String transactionId,
            String bookingReference,
            String accountId,
            String ownerUsername,
            String direction,
            String type,
            BigDecimal amount,
            String currency,
            String counterpartyIban,
            String description,
            LocalDate bookingDate,
            String status
    ) {
        this.transactionId = transactionId;
        this.bookingReference = bookingReference;
        this.accountId = accountId;
        this.ownerUsername = ownerUsername;
        this.direction = direction;
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.counterpartyIban = counterpartyIban;
        this.description = description;
        this.bookingDate = bookingDate;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public String getDirection() {
        return direction;
    }

    public String getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getCounterpartyIban() {
        return counterpartyIban;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public String getStatus() {
        return status;
    }
}
