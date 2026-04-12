package com.bank.payment_service.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentIdempotencyRepository extends JpaRepository<PaymentIdempotencyEntity, Long> {

    Optional<PaymentIdempotencyEntity> findByRequesterUsernameAndIdempotencyKey(String requesterUsername, String idempotencyKey);
}
