package com.bank.gateway.config;

import com.bank.gateway.security.CorrelationIdFilter;
import com.bank.gateway.security.GatewayJwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;

@Configuration
public class GatewaySecurityConfig {

    @Bean
    SecurityFilterChain gatewaySecurityFilterChain(
            HttpSecurity httpSecurity,
            CorrelationIdFilter correlationIdFilter,
            GatewayJwtAuthenticationFilter gatewayJwtAuthenticationFilter
    ) throws Exception {
        httpSecurity
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health", "/actuator/info", "/api/v1/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(correlationIdFilter, AnonymousAuthenticationFilter.class)
                .addFilterBefore(gatewayJwtAuthenticationFilter, AnonymousAuthenticationFilter.class);

        return httpSecurity.build();
    }
}
