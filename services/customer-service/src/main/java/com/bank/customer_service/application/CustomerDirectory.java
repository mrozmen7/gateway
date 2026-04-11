package com.bank.customer_service.application;

import com.bank.customer_service.security.BankUserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

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
            "yavuz", new CustomerProfile(
                    "cust-1002",
                    "yavuz",
                    "Yavuz Ozmen",
                    "MASS_AFFLUENT",
                    "CH",
                    "tr-CH",
                    "yavuz@alpbank.ch",
                    "+41 79 555 40 02",
                    "2022-02-14",
                    "LOW",
                    "VERIFIED",
                    "STANDARD"
            ),
            "fatih", new CustomerProfile(
                    "cust-1003",
                    "fatih",
                    "Fatih Demir",
                    "MASS_MARKET",
                    "CH",
                    "tr-CH",
                    "fatih@alpbank.ch",
                    "+41 79 555 40 03",
                    "2023-09-01",
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
        return findProfileByUsername(principal.username());
    }

    public CustomerProfile findProfileByUsername(String username) {
        CustomerProfile profile = profilesByUsername.get(username);
        if (profile == null) {
            throw new ResponseStatusException(NOT_FOUND, "Customer profile not found");
        }
        return profile;
    }
}
