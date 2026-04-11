package com.bank.account_service.api;

import com.bank.account_service.application.AccountDirectory;
import com.bank.account_service.application.AccountRecord;
import com.bank.account_service.security.BankUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountDirectory accountDirectory;

    public AccountController(AccountDirectory accountDirectory) {
        this.accountDirectory = accountDirectory;
    }

    @GetMapping("/me")
    @Operation(summary = "Return all accounts owned by the authenticated user")
    public List<AccountSummaryResponse> myAccounts(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return accountDirectory.findAccountsFor(principal).stream()
                .map(account -> new AccountSummaryResponse(
                        account.accountId(),
                        account.iban(),
                        account.currency(),
                        account.type(),
                        account.status(),
                        account.balance()
                ))
                .toList();
    }

    @GetMapping("/{accountId}")
    @Operation(summary = "Return a single account when the caller is authorized to view it")
    public AccountDetailResponse accountById(
            @PathVariable String accountId,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            Authentication authentication
    ) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        AccountRecord account = accountDirectory.findAuthorizedAccount(accountId, principal);

        return new AccountDetailResponse(
                account.accountId(),
                account.iban(),
                account.ownerName(),
                account.ownerUsername(),
                account.currency(),
                account.type(),
                account.status(),
                account.balance(),
                principal.username(),
                correlationId
        );
    }

    @PostMapping
    @Operation(summary = "Create a new active account for the authenticated user")
    public AccountCreatedResponse createAccount(
            @Valid @RequestBody CreateAccountRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            Authentication authentication
    ) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        String effectiveCorrelationId = correlationId == null || correlationId.isBlank()
                ? "corr-" + UUID.randomUUID()
                : correlationId;

        AccountRecord account = accountDirectory.createAccount(
                principal,
                request.currency(),
                request.type(),
                request.openingBalance()
        );

        return new AccountCreatedResponse(
                account.accountId(),
                account.iban(),
                account.ownerUsername(),
                account.currency(),
                account.type(),
                account.status(),
                account.balance(),
                effectiveCorrelationId
        );
    }
}
