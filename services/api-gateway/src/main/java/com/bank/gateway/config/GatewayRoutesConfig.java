package com.bank.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    RouterFunction<ServerResponse> identityRoutes(
            @Value("${bank.services.identity-service.url}") String identityServiceUrl) {
        return route("identity-service")
                .route(path("/api/v1/auth/**"), http())
                .before(uri(identityServiceUrl))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> accountRoutes(
            @Value("${bank.services.account-service.url}") String accountServiceUrl) {
        return route("account-service")
                .route(path("/api/v1/accounts/**"), http())
                .before(uri(accountServiceUrl))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> customerRoutes(
            @Value("${bank.services.customer-service.url}") String customerServiceUrl) {
        return route("customer-service")
                .route(path("/api/v1/customers/**"), http())
                .before(uri(customerServiceUrl))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> transactionRoutes(
            @Value("${bank.services.transaction-service.url}") String transactionServiceUrl) {
        return route("transaction-service")
                .route(path("/api/v1/transactions/**"), http())
                .before(uri(transactionServiceUrl))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> paymentRoutes(
            @Value("${bank.services.payment-service.url}") String paymentServiceUrl) {
        return route("payment-service")
                .route(path("/api/v1/payments/**"), http())
                .before(uri(paymentServiceUrl))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> auditRoutes(
            @Value("${bank.services.audit-service.url}") String auditServiceUrl) {
        return route("audit-service")
                .route(path("/api/v1/audit/**"), http())
                .before(uri(auditServiceUrl))
                .build();
    }
}
