package com.bank.account_service.application;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
public class AccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String accountId;

    @Column(nullable = false, unique = true)
    private String iban;

    @Column(nullable = false)
    private String ownerUserId;

    @Column(nullable = false)
    private String ownerUsername;

    @Column(nullable = false)
    private String ownerName;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance;

    protected AccountEntity() {
    }

    public AccountEntity(
            String accountId,
            String iban,
            String ownerUserId,
            String ownerUsername,
            String ownerName,
            String currency,
            String type,
            String status,
            BigDecimal balance
    ) {
        this.accountId = accountId;
        this.iban = iban;
        this.ownerUserId = ownerUserId;
        this.ownerUsername = ownerUsername;
        this.ownerName = ownerName;
        this.currency = currency;
        this.type = type;
        this.status = status;
        this.balance = balance;
    }

    public Long getId() {
        return id;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getIban() {
        return iban;
    }

    public String getOwnerUserId() {
        return ownerUserId;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getCurrency() {
        return currency;
    }

    public String getType() {
        return type;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }
}
