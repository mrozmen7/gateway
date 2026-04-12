package com.bank.payment_service.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String paymentId;

    @Column(nullable = false)
    private String debtorAccountId;

    @Column(nullable = false)
    private String ownerUsername;

    @Column(nullable = false)
    private String billerName;

    @Column(nullable = false)
    private String billerReference;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private LocalDate scheduleDate;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private LocalDate createdAt;

    protected PaymentEntity() {
    }

    public PaymentEntity(
            String paymentId,
            String debtorAccountId,
            String ownerUsername,
            String billerName,
            String billerReference,
            BigDecimal amount,
            String currency,
            LocalDate scheduleDate,
            String status,
            LocalDate createdAt
    ) {
        this.paymentId = paymentId;
        this.debtorAccountId = debtorAccountId;
        this.ownerUsername = ownerUsername;
        this.billerName = billerName;
        this.billerReference = billerReference;
        this.amount = amount;
        this.currency = currency;
        this.scheduleDate = scheduleDate;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getDebtorAccountId() {
        return debtorAccountId;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public String getBillerName() {
        return billerName;
    }

    public String getBillerReference() {
        return billerReference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public LocalDate getScheduleDate() {
        return scheduleDate;
    }

    public String getStatus() {
        return status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }
}
