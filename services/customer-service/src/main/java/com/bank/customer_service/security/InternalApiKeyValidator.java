package com.bank.customer_service.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@Component
public class InternalApiKeyValidator {

    private final String internalApiKey;

    public InternalApiKeyValidator(@Value("${bank.internal.api-key}") String internalApiKey) {
        this.internalApiKey = internalApiKey;
    }

    public void requireValid(String providedApiKey) {
        if (!internalApiKey.equals(providedApiKey)) {
            throw new ResponseStatusException(FORBIDDEN, "Internal API key is invalid");
        }
    }
}
