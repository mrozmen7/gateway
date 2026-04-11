package com.bank.customer_service.api;

import com.bank.customer_service.application.CustomerDirectory;
import com.bank.customer_service.application.CustomerProfile;
import com.bank.customer_service.security.BankUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerDirectory customerDirectory;

    public CustomerController(CustomerDirectory customerDirectory) {
        this.customerDirectory = customerDirectory;
    }

    @GetMapping("/me")
    @Operation(summary = "Return the current authenticated customer's profile")
    public CustomerProfileResponse currentCustomer(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        CustomerProfile profile = customerDirectory.findProfileFor(principal);

        return new CustomerProfileResponse(
                profile.userId(),
                profile.username(),
                profile.fullName(),
                profile.segment(),
                profile.residencyCountry(),
                profile.preferredLanguage(),
                profile.email(),
                profile.phone(),
                profile.relationshipSince(),
                profile.riskRating()
        );
    }

    @GetMapping("/me/kyc")
    @Operation(summary = "Return KYC and risk metadata for the current authenticated customer")
    public CustomerKycResponse currentCustomerKyc(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        CustomerProfile profile = customerDirectory.findProfileFor(principal);

        return new CustomerKycResponse(
                profile.userId(),
                profile.username(),
                profile.kycStatus(),
                profile.kycLevel(),
                profile.riskRating()
        );
    }
}
