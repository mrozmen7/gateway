package com.bank.customer_service.api;

import com.bank.customer_service.application.CustomerDirectory;
import com.bank.customer_service.application.CustomerProfile;
import com.bank.customer_service.security.InternalApiKeyValidator;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
@RequestMapping("/internal/customers")
public class InternalCustomerController {

    private final CustomerDirectory customerDirectory;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public InternalCustomerController(CustomerDirectory customerDirectory, InternalApiKeyValidator internalApiKeyValidator) {
        this.customerDirectory = customerDirectory;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/{username:.+}/eligibility")
    public CustomerEligibilityResponse customerEligibility(
            @PathVariable String username,
            @RequestHeader("X-Internal-Api-Key") String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        CustomerProfile profile = customerDirectory.findProfileByUsername(username);

        return new CustomerEligibilityResponse(
                profile.userId(),
                profile.username(),
                profile.fullName(),
                profile.segment(),
                profile.kycStatus(),
                profile.kycLevel(),
                profile.riskRating()
        );
    }
}
