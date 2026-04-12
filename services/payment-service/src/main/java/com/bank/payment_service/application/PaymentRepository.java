package com.bank.payment_service.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    List<PaymentEntity> findByOwnerUsernameOrderByIdDesc(String ownerUsername);

    Optional<PaymentEntity> findByPaymentId(String paymentId);
}
