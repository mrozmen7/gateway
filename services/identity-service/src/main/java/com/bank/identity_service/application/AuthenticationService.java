package com.bank.identity_service.application;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthenticationService {

    private final PasswordEncoder passwordEncoder;
    private final Map<String, BankUser> users;

    public AuthenticationService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        this.users = Map.of(
                "lena.meyer", new BankUser("cust-1001", "lena.meyer", passwordEncoder.encode("SecurePass123!"), "CUSTOMER", "Lena Meyer"),
                "marc.steiner", new BankUser("ops-2001", "marc.steiner", passwordEncoder.encode("OpsPass123!"), "OPS", "Marc Steiner"),
                "audrey.keller", new BankUser("audit-3001", "audrey.keller", passwordEncoder.encode("AuditPass123!"), "AUDITOR", "Audrey Keller")
        );
    }

    public BankUser authenticate(String username, String password) {
        BankUser user = users.get(username);
        if (user == null || !passwordEncoder.matches(password, user.passwordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Username or password is invalid");
        }
        return user;
    }
}
