package com.bank.gateway.config;

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
    RouterFunction<ServerResponse> identityRoutes() {
        return route("identity-service")
                .route(path("/api/v1/auth/**"), http())
                .before(uri("http://localhost:8081"))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> accountRoutes() {
        return route("account-service")
                .route(path("/api/v1/accounts/**"), http())
                .before(uri("http://localhost:8082"))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> customerRoutes() {
        return route("customer-service")
                .route(path("/api/v1/customers/**"), http())
                .before(uri("http://localhost:8083"))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> transactionRoutes() {
        return route("transaction-service")
                .route(path("/api/v1/transactions/**"), http())
                .before(uri("http://localhost:8084"))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> paymentRoutes() {
        return route("payment-service")
                .route(path("/api/v1/payments/**"), http())
                .before(uri("http://localhost:8085"))
                .build();
    }

    @Bean
    RouterFunction<ServerResponse> auditRoutes() {
        return route("audit-service")
                .route(path("/api/v1/audit/**"), http())
                .before(uri("http://localhost:8086"))
                .build();
    }
}
