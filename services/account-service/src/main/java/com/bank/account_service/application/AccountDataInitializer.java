package com.bank.account_service.application;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class AccountDataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;

    public AccountDataInitializer(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public void run(String... args) {
        if (accountRepository.count() > 0) {
            return;
        }

        accountRepository.saveAll(List.of(
                new AccountEntity("acc-chf-001", "CH93-0076-2011-6238-5295-7", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "CHECKING", "ACTIVE", new BigDecimal("12500.35")),
                new AccountEntity("acc-chf-002", "CH44-0099-9123-0008-8123-4", "cust-1001", "lena.meyer", "Lena Meyer", "CHF", "SAVINGS", "ACTIVE", new BigDecimal("82000.00")),
                new AccountEntity("acc-ops-001", "CH10-0000-2000-0000-8888-1", "ops-9001", "marc.steiner", "Marc Steiner", "CHF", "OPERATIONS", "ACTIVE", new BigDecimal("0.00"))
        ));
    }
}
