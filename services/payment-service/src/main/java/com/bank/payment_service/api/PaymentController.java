package com.bank.payment_service.api;

import com.bank.payment_service.application.PaymentCommand;
import com.bank.payment_service.application.PaymentDirectory;
import com.bank.payment_service.application.PaymentRecord;
import com.bank.payment_service.application.PaymentProcessingService;
import com.bank.payment_service.security.BankUserPrincipal;
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
@RequestMapping("/api/v1/payments")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentDirectory paymentDirectory;
    private final PaymentProcessingService paymentProcessingService;

    public PaymentController(PaymentDirectory paymentDirectory, PaymentProcessingService paymentProcessingService) {
        this.paymentDirectory = paymentDirectory;
        this.paymentProcessingService = paymentProcessingService;
    }

    @GetMapping("/me")
    @Operation(summary = "Return all bill payments created by the authenticated user")
    public List<PaymentResponse> myPayments(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return paymentDirectory.findPaymentsFor(principal).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Return a single payment when the caller is authorized to view it")
    public PaymentResponse paymentById(@PathVariable String paymentId, Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return toResponse(paymentDirectory.findAuthorizedPayment(paymentId, principal));
    }

    @PostMapping
    @Operation(summary = "Create a domestic bill payment from an authenticated user's account")
    public PaymentCreatedResponse createPayment(
            @Valid @RequestBody PaymentCreateRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            Authentication authentication
    ) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        String effectiveCorrelationId = correlationId == null || correlationId.isBlank()
                ? "corr-" + UUID.randomUUID()
                : correlationId;

        PaymentRecord payment = paymentProcessingService.processPayment(
                new PaymentCommand(
                        request.debtorAccountId(),
                        request.billerName(),
                        request.billerReference(),
                        request.amount(),
                        request.currency(),
                        request.scheduleDate()
                ),
                principal,
                effectiveCorrelationId
        );

        return new PaymentCreatedResponse(
                payment.paymentId(),
                payment.status(),
                principal.username(),
                effectiveCorrelationId
        );
    }

    private PaymentResponse toResponse(PaymentRecord payment) {
        return new PaymentResponse(
                payment.paymentId(),
                payment.debtorAccountId(),
                payment.billerName(),
                payment.billerReference(),
                payment.amount(),
                payment.currency(),
                payment.scheduleDate(),
                payment.status(),
                payment.createdAt()
        );
    }
}
