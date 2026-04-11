package com.bank.transaction_service.api;

import com.bank.transaction_service.application.TransactionLedger;
import com.bank.transaction_service.application.TransactionRecord;
import com.bank.transaction_service.application.TransferCommand;
import com.bank.transaction_service.application.TransferResult;
import com.bank.transaction_service.security.BankUserPrincipal;
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

@RestController
@RequestMapping("/api/v1/transactions")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionLedger transactionLedger;

    public TransactionController(TransactionLedger transactionLedger) {
        this.transactionLedger = transactionLedger;
    }

    @GetMapping("/me")
    @Operation(summary = "Return the transaction history of the authenticated user")
    public List<TransactionSummaryResponse> myTransactions(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return transactionLedger.findTransactionsFor(principal).stream()
                .map(transaction -> new TransactionSummaryResponse(
                        transaction.transactionId(),
                        transaction.accountId(),
                        transaction.direction(),
                        transaction.type(),
                        transaction.amount(),
                        transaction.currency(),
                        transaction.bookingDate(),
                        transaction.status()
                ))
                .toList();
    }

    @GetMapping("/{transactionId}")
    @Operation(summary = "Return a single transaction when the caller is authorized to view it")
    public TransactionDetailResponse transactionById(@PathVariable String transactionId, Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        TransactionRecord transaction = transactionLedger.findAuthorizedTransaction(transactionId, principal);

        return new TransactionDetailResponse(
                transaction.transactionId(),
                transaction.accountId(),
                transaction.direction(),
                transaction.type(),
                transaction.amount(),
                transaction.currency(),
                transaction.counterpartyIban(),
                transaction.description(),
                transaction.bookingDate(),
                transaction.status(),
                principal.username()
        );
    }

    @PostMapping("/transfers")
    @Operation(summary = "Create a domestic transfer from an authenticated user's account")
    public TransferResponse createTransfer(
            @Valid @RequestBody TransferRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            Authentication authentication
    ) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        TransferResult result = transactionLedger.createTransfer(
                new TransferCommand(
                        request.fromAccountId(),
                        request.toIban(),
                        request.amount(),
                        request.currency(),
                        request.description()
                ),
                principal
        );

        return new TransferResponse(
                result.transactionId(),
                result.bookingReference(),
                result.status(),
                result.amount(),
                result.currency(),
                principal.username(),
                correlationId
        );
    }
}
