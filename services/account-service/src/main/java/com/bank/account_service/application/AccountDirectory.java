package com.bank.account_service.application;

import com.bank.account_service.security.BankUserPrincipal;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AccountDirectory {

    private final AccountRepository accountRepository;

    public AccountDirectory(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<AccountRecord> findAccountsFor(BankUserPrincipal principal) {
        return accountRepository.findByOwnerUsernameOrderByIdDesc(principal.username()).stream()
                .map(this::toRecord)
                .toList();
    }

    public AccountRecord findAuthorizedAccount(String accountId, BankUserPrincipal principal) {
        AccountEntity entity = loadByAccountId(accountId);

        if ("OPS".equals(principal.role()) || "AUDITOR".equals(principal.role()) || entity.getOwnerUsername().equals(principal.username())) {
            return toRecord(entity);
        }

        throw new ResponseStatusException(NOT_FOUND, "Account not found");
    }

    public AccountRecord findAccountById(String accountId) {
        return toRecord(loadByAccountId(accountId));
    }

    @Transactional
    public AccountRecord createAccount(BankUserPrincipal principal, String currency, String type, String openingBalance) {
        BigDecimal normalizedBalance = parsePositiveOrZero(openingBalance, "Opening balance");

        AccountEntity entity = new AccountEntity(
                nextAccountId(),
                nextIban(),
                principal.userId(),
                principal.username(),
                displayNameFrom(principal.username()),
                normalizeUpper(currency, "currency"),
                normalizeUpper(type, "type"),
                "ACTIVE",
                normalizedBalance
        );

        return toRecord(accountRepository.save(entity));
    }

    @Transactional
    public InternalTransferSettlementResult settleTransfer(InternalTransferSettlementCommand command) {
        AccountEntity source = loadByAccountId(command.sourceAccountId());
        AccountEntity target = loadByIban(command.targetIban());
        BigDecimal amount = parseStrictlyPositive(command.amount(), "Transfer amount");
        String currency = normalizeUpper(command.currency(), "currency");

        ensureActive(source, "Source account");
        ensureActive(target, "Target account");
        ensureCurrency(source, currency, "Source account");
        ensureCurrency(target, currency, "Target account");

        if (source.getIban().equals(target.getIban())) {
            throw new ResponseStatusException(BAD_REQUEST, "Source and target account cannot be the same");
        }

        if (source.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(CONFLICT, "Insufficient funds on source account");
        }

        source.setBalance(source.getBalance().subtract(amount));
        target.setBalance(target.getBalance().add(amount));

        accountRepository.save(source);
        accountRepository.save(target);

        return new InternalTransferSettlementResult(
                source.getAccountId(),
                source.getOwnerUsername(),
                source.getIban(),
                formatAmount(source.getBalance()),
                target.getAccountId(),
                target.getOwnerUsername(),
                target.getIban(),
                formatAmount(target.getBalance()),
                formatAmount(amount),
                currency,
                "BOOKED"
        );
    }

    @Transactional
    public InternalPaymentDebitResult debitPayment(InternalPaymentDebitCommand command) {
        AccountEntity debtor = loadByAccountId(command.debtorAccountId());
        BigDecimal amount = parseStrictlyPositive(command.amount(), "Payment amount");
        String currency = normalizeUpper(command.currency(), "currency");

        ensureActive(debtor, "Debtor account");
        ensureCurrency(debtor, currency, "Debtor account");

        if (debtor.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(CONFLICT, "Insufficient funds on debtor account");
        }

        debtor.setBalance(debtor.getBalance().subtract(amount));
        accountRepository.save(debtor);

        return new InternalPaymentDebitResult(
                debtor.getAccountId(),
                debtor.getOwnerUsername(),
                debtor.getOwnerName(),
                formatAmount(debtor.getBalance()),
                formatAmount(amount),
                currency,
                "BOOKED"
        );
    }

    private AccountEntity loadByAccountId(String accountId) {
        return accountRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Account not found"));
    }

    private AccountEntity loadByIban(String iban) {
        return accountRepository.findByIban(iban)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Target IBAN not found"));
    }

    private void ensureActive(AccountEntity entity, String label) {
        if (!"ACTIVE".equals(entity.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, label + " is not active");
        }
    }

    private void ensureCurrency(AccountEntity entity, String currency, String label) {
        if (!entity.getCurrency().equals(currency)) {
            throw new ResponseStatusException(BAD_REQUEST, label + " currency mismatch");
        }
    }

    private BigDecimal parseStrictlyPositive(String rawAmount, String label) {
        BigDecimal amount = parseAmount(rawAmount, label);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, label + " must be greater than zero");
        }
        return amount;
    }

    private BigDecimal parsePositiveOrZero(String rawAmount, String label) {
        BigDecimal amount = parseAmount(rawAmount, label);
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(BAD_REQUEST, label + " must be zero or positive");
        }
        return amount;
    }

    private BigDecimal parseAmount(String rawAmount, String label) {
        try {
            return new BigDecimal(rawAmount).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(BAD_REQUEST, label + " must be a valid decimal number");
        }
    }

    private String nextAccountId() {
        String candidate;
        do {
            candidate = "acc-" + UUID.randomUUID().toString().substring(0, 8);
        } while (accountRepository.existsByAccountId(candidate));
        return candidate;
    }

    private String nextIban() {
        String candidate;
        do {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase(Locale.ROOT);
            candidate = "CH" + suffix;
        } while (accountRepository.existsByIban(candidate));
        return candidate;
    }

    private String normalizeUpper(String rawValue, String fieldName) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " is required");
        }
        return rawValue.trim().toUpperCase(Locale.ROOT);
    }

    private String displayNameFrom(String username) {
        String[] parts = username.split("\\.");
        if (parts.length == 2) {
            return capitalize(parts[0]) + " " + capitalize(parts[1]);
        }
        return capitalize(username);
    }

    private String capitalize(String rawValue) {
        if (rawValue.isBlank()) {
            return rawValue;
        }
        return rawValue.substring(0, 1).toUpperCase(Locale.ROOT) + rawValue.substring(1);
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private AccountRecord toRecord(AccountEntity entity) {
        return new AccountRecord(
                entity.getAccountId(),
                entity.getIban(),
                entity.getOwnerUserId(),
                entity.getOwnerUsername(),
                entity.getOwnerName(),
                entity.getCurrency(),
                entity.getType(),
                entity.getStatus(),
                formatAmount(entity.getBalance())
        );
    }
}
