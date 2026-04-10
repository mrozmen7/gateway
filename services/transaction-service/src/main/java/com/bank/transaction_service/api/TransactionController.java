package com.bank.transaction_service.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    @GetMapping("/summary")
    public Map<String, Object> summary(@RequestHeader(value = "X-Correlation-Id", required = false) String correlationId) {
        return Map.of(
                "service", "transaction-service",
                "message", "Transaction routing is wired. Ledger logic will arrive in later phases.",
                "correlationId", correlationId
        );
    }
}
