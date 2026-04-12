package com.bank.account_service.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<AccountEntity, Long> {

    List<AccountEntity> findByOwnerUsernameOrderByIdDesc(String ownerUsername);

    Optional<AccountEntity> findByAccountId(String accountId);

    Optional<AccountEntity> findByIban(String iban);

    boolean existsByAccountId(String accountId);

    boolean existsByIban(String iban);
}
