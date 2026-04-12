package com.bank.payment_service.application;

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
        name = "payment_idempotency",
        uniqueConstraints = @UniqueConstraint(columnNames = {"requesterUsername", "idempotencyKey"})
)
public class PaymentIdempotencyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requesterUsername;

    @Column(nullable = false)
    private String idempotencyKey;

    @Column(nullable = false)
    private String paymentId;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String correlationId;

    protected PaymentIdempotencyEntity() {
    }

    public PaymentIdempotencyEntity(
            String requesterUsername,
            String idempotencyKey,
            String paymentId,
            String status,
            BigDecimal amount,
            String currency,
            String correlationId
    ) {
        this.requesterUsername = requesterUsername;
        this.idempotencyKey = idempotencyKey;
        this.paymentId = paymentId;
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

    public String getPaymentId() {
        return paymentId;
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
