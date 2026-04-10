package com.bank.identity_service.security;

import com.bank.identity_service.application.BankUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class IdentityJwtTokenService {

    private final ObjectMapper objectMapper;
    private final String secret;
    private final String issuer;
    private final long expirationSeconds;

    public IdentityJwtTokenService(
            ObjectMapper objectMapper,
            @Value("${bank.security.jwt.secret}") String secret,
            @Value("${bank.security.jwt.issuer}") String issuer,
            @Value("${bank.security.jwt.expiration-seconds}") long expirationSeconds
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.issuer = issuer;
        this.expirationSeconds = expirationSeconds;
    }

    public String createToken(BankUser user) {
        try {
            Instant now = Instant.now();
            String tokenId = UUID.randomUUID().toString();

            Map<String, Object> header = Map.of(
                    "alg", "HS256",
                    "typ", "JWT"
            );

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("iss", issuer);
            payload.put("sub", user.userId());
            payload.put("preferred_username", user.username());
            payload.put("role", user.role());
            payload.put("iat", now.getEpochSecond());
            payload.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());
            payload.put("jti", tokenId);

            String encodedHeader = encodeJson(header);
            String encodedPayload = encodeJson(payload);
            String signingInput = encodedHeader + "." + encodedPayload;

            return signingInput + "." + sign(signingInput);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not create access token", exception);
        }
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
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(payloadJson, Map.class);

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

    private String encodeJson(Map<String, Object> value) throws Exception {
        String json = objectMapper.writeValueAsString(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
    }
}
