package com.bank.transaction_service.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntryEntity, Long> {

    List<LedgerEntryEntity> findByOwnerUsernameOrderByIdDesc(String ownerUsername);

    Optional<LedgerEntryEntity> findFirstByTransactionIdAndOwnerUsernameOrderByIdAsc(String transactionId, String ownerUsername);

    Optional<LedgerEntryEntity> findFirstByTransactionIdOrderByIdAsc(String transactionId);
}
