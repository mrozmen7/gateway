package com.bank.account_service.application;

import com.bank.account_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AccountDirectory {

    private final Map<String, List<AccountRecord>> accountsByUsername = Map.of(
            "lena.meyer", List.of(
                    new AccountRecord("acc-chf-001", "CH93-0076-2011-6238-5295-7", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "CHECKING", "ACTIVE", "12500.35"),
                    new AccountRecord("acc-chf-002", "CH44-0099-9123-0008-8123-4", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "SAVINGS", "ACTIVE", "82000.00")
            ),
            "marc.steiner", List.of(
                    new AccountRecord("acc-ops-001", "CH55-0900-0000-1111-2222-3", "ops-2001", "marc.steiner", "Marc Steiner", "CHF", "INTERNAL", "ACTIVE", "0.00")
            )
    );

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
}
