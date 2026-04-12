package com.bank.payment_service.application;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class PaymentDataInitializer implements CommandLineRunner {

    private final PaymentRepository paymentRepository;

    public PaymentDataInitializer(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    public void run(String... args) {
        if (paymentRepository.count() > 0) {
            return;
        }

        paymentRepository.saveAll(List.of(
                new PaymentEntity("pay-1001", "acc-chf-001", "lena.meyer", "Swisscom", "INV-2026-7781", new BigDecimal("129.90"), "CHF", LocalDate.parse("2026-04-12"), "SCHEDULED", LocalDate.parse("2026-04-09")),
                new PaymentEntity("pay-1002", "acc-chf-002", "lena.meyer", "ZVV", "ABO-2026-04", new BigDecimal("87.00"), "CHF", LocalDate.parse("2026-04-02"), "BOOKED", LocalDate.parse("2026-03-30"))
        ));
    }
}
