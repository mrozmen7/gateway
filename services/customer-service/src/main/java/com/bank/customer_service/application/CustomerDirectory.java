package com.bank.customer_service.application;

import com.bank.customer_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomerDirectory {

    private final Map<String, CustomerProfile> profilesByUsername = Map.of(
            "lena.meyer", new CustomerProfile(
                    "cust-1001",
                    "lena.meyer",
                    "Lena Meyer",
                    "AFFLUENT",
                    "CH",
                    "de-CH",
                    "lena.meyer@alpbank.ch",
                    "+41 79 555 10 01",
                    "2019-04-15",
                    "LOW",
                    "VERIFIED",
                    "STANDARD"
            ),
            "marc.steiner", new CustomerProfile(
                    "ops-2001",
                    "marc.steiner",
                    "Marc Steiner",
                    "INTERNAL",
                    "CH",
                    "de-CH",
                    "marc.steiner@alpbank.ch",
                    "+41 79 555 20 01",
                    "2021-01-03",
                    "LOW",
                    "INTERNAL",
                    "STAFF"
            ),
            "audrey.keller", new CustomerProfile(
                    "audit-3001",
                    "audrey.keller",
                    "Audrey Keller",
                    "INTERNAL",
                    "CH",
                    "fr-CH",
                    "audrey.keller@alpbank.ch",
                    "+41 79 555 30 01",
                    "2020-08-11",
                    "LOW",
                    "INTERNAL",
                    "STAFF"
            )
    );

    public CustomerProfile findProfileFor(BankUserPrincipal principal) {
        return profilesByUsername.get(principal.username());
    }
}
