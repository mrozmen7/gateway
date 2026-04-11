package com.bank.account_service.application;

import com.bank.account_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AccountDirectory {

    private final ConcurrentHashMap<String, List<AccountRecord>> accountsByUsername = new ConcurrentHashMap<>(Map.of(
            "lena.meyer", new ArrayList<>(List.of(
                    new AccountRecord("acc-chf-001", "CH93-0076-2011-6238-5295-7", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "CHECKING", "ACTIVE", "12500.35"),
                    new AccountRecord("acc-chf-002", "CH44-0099-9123-0008-8123-4", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "SAVINGS", "ACTIVE", "82000.00")
            )),
            "marc.steiner", new ArrayList<>(List.of(
                    new AccountRecord("acc-ops-001", "CH55-0900-0000-1111-2222-3", "ops-2001", "marc.steiner", "Marc Steiner", "CHF", "INTERNAL", "ACTIVE", "0.00")
            ))
    ));

    public List<AccountRecord> findAccountsFor(BankUserPrincipal principal) {
        return accountsByUsername.getOrDefault(principal.username(), List.of());
    }

    public AccountRecord findAuthorizedAccount(String accountId, BankUserPrincipal principal) {
        Optional<AccountRecord> account = accountsByUsername.values().stream()
                .flatMap(List::stream)
                .filter(candidate -> candidate.accountId().equals(accountId))
                .findFirst();

        AccountRecord accountRecord = account.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Account not found"));

        if ("OPS".equals(principal.role()) || "AUDITOR".equals(principal.role())) {
            return accountRecord;
        }

        if (!accountRecord.ownerUsername().equals(principal.username())) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to access this account");
        }

        return accountRecord;
    }

    public AccountRecord findAccountById(String accountId) {
        return accountsByUsername.values().stream()
                .flatMap(List::stream)
                .filter(candidate -> candidate.accountId().equals(accountId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Account not found"));
    }

    public AccountRecord createAccount(BankUserPrincipal principal, String currency, String type, String openingBalance) {
        String normalizedCurrency = currency.trim().toUpperCase();
        String normalizedType = type.trim().toUpperCase();
        String normalizedBalance = normalizeBalance(openingBalance);

        AccountRecord account = new AccountRecord(
                "acc-" + UUID.randomUUID().toString().substring(0, 8),
                generateIban(),
                principal.userId(),
                principal.username(),
                displayNameFrom(principal.username()),
                normalizedCurrency,
                normalizedType,
                "ACTIVE",
                normalizedBalance
        );

        accountsByUsername.computeIfAbsent(principal.username(), ignored -> new ArrayList<>()).add(0, account);
        return account;
    }

    private String generateIban() {
        String raw = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return "CH" + raw.substring(0, 2) + "-" + raw.substring(2, 6) + "-" + raw.substring(6, 10) + "-" + raw.substring(10, 14) + "-" + raw.substring(14, 18);
    }

    private String displayNameFrom(String username) {
        String[] tokens = username.split("\\.");
        return List.of(tokens).stream()
                .filter(token -> !token.isBlank())
                .map(token -> Character.toUpperCase(token.charAt(0)) + token.substring(1))
                .reduce((left, right) -> left + " " + right)
                .orElse(username);
    }

    private String normalizeBalance(String openingBalance) {
        try {
            BigDecimal amount = new BigDecimal(openingBalance);
            if (amount.signum() < 0) {
                throw new IllegalArgumentException("Opening balance cannot be negative");
            }
            return amount.setScale(2).toPlainString();
        } catch (Exception exception) {
            throw new ResponseStatusException(FORBIDDEN, "Opening balance must be a valid non-negative decimal");
        }
    }
}
