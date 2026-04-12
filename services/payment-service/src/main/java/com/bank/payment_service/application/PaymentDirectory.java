package com.bank.payment_service.application;

import com.bank.payment_service.security.BankUserPrincipal;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PaymentDirectory {

    private final PaymentRepository paymentRepository;
    private final PaymentIdempotencyRepository paymentIdempotencyRepository;

    public PaymentDirectory(PaymentRepository paymentRepository, PaymentIdempotencyRepository paymentIdempotencyRepository) {
        this.paymentRepository = paymentRepository;
        this.paymentIdempotencyRepository = paymentIdempotencyRepository;
    }

    public List<PaymentRecord> findPaymentsFor(BankUserPrincipal principal) {
        return paymentRepository.findByOwnerUsernameOrderByIdDesc(principal.username()).stream()
                .map(this::toRecord)
                .toList();
    }

    public PaymentRecord findAuthorizedPayment(String paymentId, BankUserPrincipal principal) {
        return lookupAuthorizedEntity(paymentId, principal)
                .map(this::toRecord)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Payment not found"));
    }

    public PaymentRecord findIdempotentPayment(String requesterUsername, String idempotencyKey) {
        return paymentIdempotencyRepository.findByRequesterUsernameAndIdempotencyKey(requesterUsername, idempotencyKey)
                .flatMap(entity -> paymentRepository.findByPaymentId(entity.getPaymentId()))
                .map(this::toRecord)
                .orElse(null);
    }

    @Transactional
    public PaymentRecord createPayment(PaymentCommand command, String ownerUsername) {
        PaymentEntity payment = new PaymentEntity(
                "pay-" + UUID.randomUUID().toString().substring(0, 8),
                command.debtorAccountId(),
                ownerUsername,
                command.billerName(),
                command.billerReference(),
                parseAmount(command.amount()),
                command.currency(),
                LocalDate.parse(command.scheduleDate()),
                "BOOKED",
                LocalDate.now()
        );

        return toRecord(paymentRepository.save(payment));
    }

    @Transactional
    public void rememberIdempotentPayment(String requesterUsername, String idempotencyKey, PaymentRecord payment, String correlationId) {
        paymentIdempotencyRepository.save(new PaymentIdempotencyEntity(
                requesterUsername,
                idempotencyKey,
                payment.paymentId(),
                payment.status(),
                parseAmount(payment.amount()),
                payment.currency(),
                correlationId
        ));
    }

    private boolean canAccess(BankUserPrincipal principal, String ownerUsername) {
        return "OPS".equals(principal.role()) || "AUDITOR".equals(principal.role()) || ownerUsername.equals(principal.username());
    }

    private java.util.Optional<PaymentEntity> lookupAuthorizedEntity(String paymentId, BankUserPrincipal principal) {
        return paymentRepository.findByPaymentId(paymentId)
                .filter(payment -> canAccess(principal, payment.getOwnerUsername()));
    }

    private PaymentRecord toRecord(PaymentEntity entity) {
        return new PaymentRecord(
                entity.getPaymentId(),
                entity.getDebtorAccountId(),
                entity.getOwnerUsername(),
                entity.getBillerName(),
                entity.getBillerReference(),
                formatAmount(entity.getAmount()),
                entity.getCurrency(),
                entity.getScheduleDate().toString(),
                entity.getStatus(),
                entity.getCreatedAt().toString()
        );
    }

    private BigDecimal parseAmount(String amount) {
        return new BigDecimal(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
