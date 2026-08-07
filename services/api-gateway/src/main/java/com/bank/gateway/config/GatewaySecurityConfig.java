package com.bank.gateway.config;

import com.bank.gateway.security.CorrelationIdFilter;
import com.bank.gateway.security.GatewayJwtAuthenticationFilter;
import com.bank.gateway.securityevents.ApiSecurityEventFilter;
import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class GatewaySecurityConfig {

    @Bean
    SecurityFilterChain gatewaySecurityFilterChain(
            HttpSecurity httpSecurity,
            CorrelationIdFilter correlationIdFilter,
            ApiSecurityEventFilter apiSecurityEventFilter,
            GatewayJwtAuthenticationFilter gatewayJwtAuthenticationFilter
    ) throws Exception {
        httpSecurity
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.getWriter().write("""
                                    {"error":"authentication_required","message":"Send a valid bearer token issued by identity-service."}
                                    """);
                        })
                )
                .authorizeHttpRequests(authorize -> authorize
                        .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR, DispatcherType.ASYNC).permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/prometheus",
                                "/api/v1/auth/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers("/api/v1/ops/**").hasRole("OPS")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(correlationIdFilter, AnonymousAuthenticationFilter.class)
                .addFilterBefore(gatewayJwtAuthenticationFilter, AnonymousAuthenticationFilter.class)
                .addFilterAfter(apiSecurityEventFilter, AnonymousAuthenticationFilter.class);

        return httpSecurity.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Correlation-Id",
                "Idempotency-Key"
        ));
        configuration.setExposedHeaders(List.of("X-Correlation-Id"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
