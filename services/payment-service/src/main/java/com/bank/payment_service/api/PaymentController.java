package com.bank.payment_service.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @GetMapping("/capabilities")
    public Map<String, Object> capabilities(@RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return Map.of(
                "service", "payment-service",
                "message", "Payment service is reachable. Idempotency and orchestration will be implemented later.",
                "correlationId", correlationId
        );
    }
}
