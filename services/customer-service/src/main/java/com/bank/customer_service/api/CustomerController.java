package com.bank.customer_service.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    @GetMapping("/me")
    public Map<String, Object> currentCustomer(@RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return Map.of(
                "service", "customer-service",
                "message", "Customer profile boundary is reachable through the gateway.",
                "correlationId", correlationId,
                "nextPhase", "Customer profile data and KYC fields will be implemented later."
        );
    }
}
