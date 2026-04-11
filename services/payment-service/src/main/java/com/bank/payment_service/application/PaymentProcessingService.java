package com.bank.payment_service.application;

import com.bank.payment_service.security.BankUserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class PaymentProcessingService {

    private final PaymentDirectory paymentDirectory;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String internalApiKey;
    private final String accountServiceUrl;
    private final String customerServiceUrl;
    private final String auditServiceUrl;
    private final Duration requestTimeout;
    private final int maxAttempts;

    public PaymentProcessingService(
            PaymentDirectory paymentDirectory,
            ObjectMapper objectMapper,
            @Value("${bank.internal.api-key}") String internalApiKey,
            @Value("${bank.services.account-service.url}") String accountServiceUrl,
            @Value("${bank.services.customer-service.url}") String customerServiceUrl,
            @Value("${bank.services.audit-service.url}") String auditServiceUrl,
            @Value("${bank.services.http.timeout-millis}") long timeoutMillis,
            @Value("${bank.services.http.max-attempts}") int maxAttempts
    ) {
        this.paymentDirectory = paymentDirectory;
        this.objectMapper = objectMapper;
        this.internalApiKey = internalApiKey;
        this.accountServiceUrl = accountServiceUrl;
        this.customerServiceUrl = customerServiceUrl;
        this.auditServiceUrl = auditServiceUrl;
        this.requestTimeout = Duration.ofMillis(timeoutMillis);
        this.maxAttempts = maxAttempts;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(this.requestTimeout)
                .build();
    }

    public PaymentRecord processPayment(PaymentCommand command, BankUserPrincipal principal, String correlationId) {
        if ("AUDITOR".equals(principal.role())) {
            throw new ResponseStatusException(FORBIDDEN, "Auditors can review payments but cannot create them");
        }

        InternalAccountVerification account = verifyAccount(command.debtorAccountId(), correlationId);
        ensureCallerCanUseAccount(principal, account);

        InternalCustomerEligibility customer = loadCustomerEligibility(account.ownerUsername(), correlationId);
        ensureCustomerEligible(principal, customer);

        PaymentRecord payment = paymentDirectory.createPayment(command, account.ownerUsername());

        recordAuditEvent(
                new InternalAuditEventRequest(
                        principal.username(),
                        principal.role(),
                        "PAYMENT_INITIATED",
                        "payment-service",
                        "CREATE_PAYMENT",
                        "SUCCESS",
                        correlationId,
                        "Payment " + payment.paymentId() + " created for account " + command.debtorAccountId()
                ),
                correlationId
        );

        return payment;
    }

    private void ensureCallerCanUseAccount(BankUserPrincipal principal, InternalAccountVerification account) {
        if ("OPS".equals(principal.role())) {
            return;
        }

        if (!account.ownerUsername().equals(principal.username())) {
            throw new ResponseStatusException(FORBIDDEN, "You are not allowed to create a payment from this account");
        }
    }

    private void ensureCustomerEligible(BankUserPrincipal principal, InternalCustomerEligibility customer) {
        if ("CUSTOMER".equals(principal.role()) && !"VERIFIED".equals(customer.kycStatus())) {
            throw new ResponseStatusException(FORBIDDEN, "Customer KYC status does not allow payment initiation");
        }

        if ("CUSTOMER".equals(principal.role()) && "HIGH".equals(customer.riskRating())) {
            throw new ResponseStatusException(FORBIDDEN, "Customer risk level requires manual review before payment");
        }
    }

    private InternalAccountVerification verifyAccount(String accountId, String correlationId) {
        InternalHttpResponse response = sendWithRetry(
                baseRequest(accountServiceUrl + "/internal/accounts/" + encode(accountId) + "/verification", correlationId)
                        .GET()
                        .build(),
                "account-service verification"
        );

        return switch (response.statusCode()) {
            case 200 -> readBody(response.body(), InternalAccountVerification.class, "account verification");
            case 404 -> throw new ResponseStatusException(NOT_FOUND, "Debtor account not found");
            default -> throw new ResponseStatusException(BAD_GATEWAY, "Account verification failed via account-service");
        };
    }

    private InternalCustomerEligibility loadCustomerEligibility(String username, String correlationId) {
        InternalHttpResponse response = sendWithRetry(
                baseRequest(customerServiceUrl + "/internal/customers/" + encode(username) + "/eligibility", correlationId)
                        .GET()
                        .build(),
                "customer-service eligibility"
        );

        return switch (response.statusCode()) {
            case 200 -> readBody(response.body(), InternalCustomerEligibility.class, "customer eligibility");
            case 404 -> throw new ResponseStatusException(NOT_FOUND, "Customer profile not found for payment");
            default -> throw new ResponseStatusException(BAD_GATEWAY, "Customer eligibility lookup failed via customer-service");
        };
    }

    private void recordAuditEvent(InternalAuditEventRequest request, String correlationId) {
        InternalHttpResponse response = sendWithRetry(
                withJsonBody(baseRequest(auditServiceUrl + "/internal/audit/events", correlationId), request),
                "audit-service write"
        );

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(BAD_GATEWAY, "Audit-service could not persist the payment audit event");
        }
    }

    private HttpRequest.Builder baseRequest(String url, String correlationId) {
        return HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(requestTimeout)
                .header("Accept", "application/json")
                .header("X-Internal-Api-Key", internalApiKey)
                .header("X-Correlation-Id", correlationId);
    }

    private HttpRequest withJsonBody(HttpRequest.Builder builder, Object body) {
        try {
            return builder
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Could not serialize internal audit request", exception);
        }
    }

    private InternalHttpResponse sendWithRetry(HttpRequest request, String dependencyName) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 500 && attempt < maxAttempts) {
                    continue;
                }
                return new InternalHttpResponse(response.statusCode(), response.body());
            } catch (IOException exception) {
                if (attempt == maxAttempts) {
                    throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Could not reach " + dependencyName, exception);
                }
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Interrupted while calling " + dependencyName, exception);
            }
        }

        throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Could not reach " + dependencyName);
    }

    private <T> T readBody(String body, Class<T> targetType, String dependencyName) {
        try {
            return objectMapper.readValue(body, targetType);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Could not parse " + dependencyName + " response", exception);
        }
    }

    private String encode(String rawValue) {
        return URLEncoder.encode(rawValue, StandardCharsets.UTF_8);
    }

    private record InternalHttpResponse(int statusCode, String body) {
    }

    private record InternalAccountVerification(
            String accountId,
            String ownerUserId,
            String ownerUsername,
            String ownerName,
            String currency,
            String type,
            String status,
            String balance
    ) {
    }

    private record InternalCustomerEligibility(
            String userId,
            String username,
            String fullName,
            String segment,
            String kycStatus,
            String kycLevel,
            String riskRating
    ) {
    }

    private record InternalAuditEventRequest(
            String actorUsername,
            String actorRole,
            String eventType,
            String resource,
            String action,
            String outcome,
            String correlationId,
            String details
    ) {
    }
}
