package com.bank.payment_service.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Component
public class PaymentJwtTokenValidator {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final String secret;
    private final String issuer;

    public PaymentJwtTokenValidator(
            ObjectMapper objectMapper,
            @Value("${bank.security.jwt.secret}") String secret,
            @Value("${bank.security.jwt.issuer}") String issuer
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.issuer = issuer;
    }

    public BankUserPrincipal validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Token format is invalid");
            }

            String signingInput = parts[0] + "." + parts[1];
            String expectedSignature = sign(signingInput);
            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Token signature is invalid");
            }

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> payload = objectMapper.readValue(payloadJson, MAP_TYPE);

            if (!issuer.equals(payload.get("iss"))) {
                throw new IllegalArgumentException("Token issuer is invalid");
            }

            long expiresAt = ((Number) payload.get("exp")).longValue();
            if (Instant.now().getEpochSecond() >= expiresAt) {
                throw new IllegalArgumentException("Token is expired");
            }

            return new BankUserPrincipal(
                    String.valueOf(payload.get("sub")),
                    String.valueOf(payload.get("preferred_username")),
                    String.valueOf(payload.get("role")),
                    String.valueOf(payload.get("jti"))
            );
        } catch (Exception exception) {
            throw new IllegalArgumentException("Token validation failed", exception);
        }
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
    }
}
