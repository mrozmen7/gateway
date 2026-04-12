package com.bank.transaction_service.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransferIdempotencyRepository extends JpaRepository<TransferIdempotencyEntity, Long> {

    Optional<TransferIdempotencyEntity> findByRequesterUsernameAndIdempotencyKey(String requesterUsername, String idempotencyKey);
}
