package com.bank.identity_service.api;

import com.bank.identity_service.application.AuthenticationService;
import com.bank.identity_service.application.BankUser;
import com.bank.identity_service.security.BankUserPrincipal;
import com.bank.identity_service.security.IdentityJwtTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final IdentityJwtTokenService tokenService;

    public AuthController(AuthenticationService authenticationService, IdentityJwtTokenService tokenService) {
        this.authenticationService = authenticationService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate a user and issue a JWT access token")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        BankUser user = authenticationService.authenticate(request.username(), request.password());
        String accessToken = tokenService.createToken(user);

        return new LoginResponse(
                accessToken,
                "Bearer",
                3600,
                user.username(),
                user.role()
        );
    }

    @GetMapping("/me")
    @Operation(
            summary = "Return the current authenticated user derived from the bearer token",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public CurrentUserResponse me(Authentication authentication) {
        BankUserPrincipal principal = (BankUserPrincipal) authentication.getPrincipal();
        return new CurrentUserResponse(
                principal.userId(),
                principal.username(),
                principal.role(),
                principal.tokenId()
        );
    }
}
