package com.bank.transaction_service.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

@Entity
@Table(
        name = "transfer_idempotency",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requesterUsername", "idempotencyKey"})
)
public class TransferIdempotencyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requesterUsername;

    @Column(nullable = false)
    private String idempotencyKey;

    @Column(nullable = false)
    private String transactionId;

    @Column(nullable = false)
    private String bookingReference;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String correlationId;

    protected TransferIdempotencyEntity() {
    }

    public TransferIdempotencyEntity(
            String requesterUsername,
            String idempotencyKey,
            String transactionId,
            String bookingReference,
            String status,
            BigDecimal amount,
            String currency,
            String correlationId
    ) {
        this.requesterUsername = requesterUsername;
        this.idempotencyKey = idempotencyKey;
        this.transactionId = transactionId;
        this.bookingReference = bookingReference;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.correlationId = correlationId;
    }

    public String getRequesterUsername() {
        return requesterUsername;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getBookingReference() {
        return bookingReference;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public String getCorrelationId() {
        return correlationId;
    }
}
