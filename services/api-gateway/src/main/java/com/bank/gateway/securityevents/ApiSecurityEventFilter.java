package com.bank.gateway.securityevents;

import com.bank.gateway.security.BankUserPrincipal;
import com.bank.gateway.security.CorrelationIdFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Component
public class ApiSecurityEventFilter extends OncePerRequestFilter {

    private final ApiSecurityEventPublisher publisher;
    private final String serviceName;

    public ApiSecurityEventFilter(
            ApiSecurityEventPublisher publisher,
            @Value("${bank.security-events.service-name}") String serviceName
    ) {
        this.publisher = publisher;
        this.serviceName = serviceName;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startedAtNanos = System.nanoTime();

        try {
            filterChain.doFilter(request, response);
        } finally {
            publisher.publish(eventFrom(request, response, elapsedMillis(startedAtNanos)));
        }
    }

    private ApiSecurityEvent eventFrom(HttpServletRequest request, HttpServletResponse response, long responseTimeMs) {
        BankUserPrincipal principal = principal();
        String correlationId = correlationId(request, response);

        return new ApiSecurityEvent(
                UUID.randomUUID().toString(),
                Instant.now().toString(),
                correlationId,
                principal.userId(),
                principal.username(),
                principal.role(),
                clientIp(request),
                valueOrUnknown(request.getHeader("User-Agent")),
                request.getRequestURI(),
                request.getMethod(),
                response.getStatus(),
                responseTimeMs,
                serviceName
        );
    }

    private BankUserPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof BankUserPrincipal bankUserPrincipal) {
            return bankUserPrincipal;
        }
        return new BankUserPrincipal("anonymous", "anonymous", "ANONYMOUS", "anonymous");
    }

    private String correlationId(HttpServletRequest request, HttpServletResponse response) {
        Object requestAttribute = request.getAttribute(CorrelationIdFilter.HEADER_NAME);
        if (requestAttribute != null && !String.valueOf(requestAttribute).isBlank()) {
            return String.valueOf(requestAttribute);
        }

        String responseHeader = response.getHeader(CorrelationIdFilter.HEADER_NAME);
        return valueOrUnknown(responseHeader);
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }

        return valueOrUnknown(request.getRemoteAddr());
    }

    private long elapsedMillis(long startedAtNanos) {
        return Math.max(1, (System.nanoTime() - startedAtNanos) / 1_000_000);
    }

    private String valueOrUnknown(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }
}
