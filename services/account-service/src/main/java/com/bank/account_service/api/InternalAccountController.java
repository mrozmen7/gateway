package com.bank.account_service.api;

import com.bank.account_service.application.AccountDirectory;
import com.bank.account_service.application.AccountRecord;
import com.bank.account_service.security.InternalApiKeyValidator;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/internal/accounts")
public class InternalAccountController {

    private final AccountDirectory accountDirectory;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public InternalAccountController(AccountDirectory accountDirectory, InternalApiKeyValidator internalApiKeyValidator) {
        this.accountDirectory = accountDirectory;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/{accountId}/verification")
    public AccountVerificationResponse verifyAccount(
            @PathVariable String accountId,
            @RequestHeader("X-Internal-Api-Key") String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        AccountRecord account = accountDirectory.findAccountById(accountId);

        return new AccountVerificationResponse(
                account.accountId(),
                account.ownerUserId(),
                account.ownerUsername(),
                account.ownerName(),
                account.currency(),
                account.type(),
                account.status(),
                account.balance()
        );
    }
}
