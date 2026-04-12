package com.bank.account_service.api;

import com.bank.account_service.application.AccountDirectory;
import com.bank.account_service.application.AccountRecord;
import com.bank.account_service.application.InternalPaymentDebitCommand;
import com.bank.account_service.application.InternalPaymentDebitResult;
import com.bank.account_service.application.InternalTransferSettlementCommand;
import com.bank.account_service.application.InternalTransferSettlementResult;
import com.bank.account_service.security.InternalApiKeyValidator;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
                account.iban(),
                account.ownerUserId(),
                account.ownerUsername(),
                account.ownerName(),
                account.currency(),
                account.type(),
                account.status(),
                account.balance()
        );
    }

    @PostMapping("/transfers/settle")
    public TransferSettlementResponse settleTransfer(
            @RequestBody TransferSettlementRequest request,
            @RequestHeader("X-Internal-Api-Key") String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        InternalTransferSettlementResult result = accountDirectory.settleTransfer(
                new InternalTransferSettlementCommand(
                        request.sourceAccountId(),
                        request.targetIban(),
                        request.amount(),
                        request.currency()
                )
        );

        return new TransferSettlementResponse(
                result.sourceAccountId(),
                result.sourceOwnerUsername(),
                result.sourceIban(),
                result.sourceBalanceAfter(),
                result.targetAccountId(),
                result.targetOwnerUsername(),
                result.targetIban(),
                result.targetBalanceAfter(),
                result.amount(),
                result.currency(),
                result.status()
        );
    }

    @PostMapping("/payments/debit")
    public PaymentDebitResponse debitPayment(
            @RequestBody PaymentDebitRequest request,
            @RequestHeader("X-Internal-Api-Key") String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        InternalPaymentDebitResult result = accountDirectory.debitPayment(
                new InternalPaymentDebitCommand(
                        request.debtorAccountId(),
                        request.amount(),
                        request.currency()
                )
        );

        return new PaymentDebitResponse(
                result.debtorAccountId(),
                result.ownerUsername(),
                result.ownerName(),
                result.balanceAfter(),
                result.amount(),
                result.currency(),
                result.status()
        );
    }
}
